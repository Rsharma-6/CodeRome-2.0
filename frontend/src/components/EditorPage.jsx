import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { initSocket } from '../Socket';
import { ACTIONS } from '../Actions';
import Editor from './Editor';
import Client from './Client';
import ChatPanel from './Chat/ChatPanel';
import AIPanel from './AI/AIPanel';
import VideoPanel from './Video/VideoPanel';
import ChangeProblemModal from './ChangeProblemModal';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  'python3', 'java', 'cpp', 'nodejs', 'c', 'ruby', 'go',
  'scala', 'bash', 'pascal', 'csharp', 'php', 'swift', 'rust', 'r',
];

const API_GATEWAY = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000';

export default function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState('');
  const [runResults, setRunResults] = useState(null); // structured test results from /run
  const [activeTestTab, setActiveTestTab] = useState(0);
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python3');
  const [rightPanel, setRightPanel] = useState('chat'); // 'chat' | 'ai' | 'video'
  const [problem, setProblem] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compilerHeight, setCompilerHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(256);
  const [rightPanelWidth, setRightPanelWidth] = useState(288);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [showChangeProblem, setShowChangeProblem] = useState(false);
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [creatorSocketId, setCreatorSocketId] = useState(null);

  const codeRef = useRef('');
  const socketRef = useRef(null);
  const setEditorCodeRef = useRef(null);
  const outputRef = useRef('');
  const setupTimerRef = useRef(null);
  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [stateReady, setStateReady] = useState(!!Location.state);
  const [resolvedUsername, setResolvedUsername] = useState(Location.state?.username || user?.username || null);

  const username = resolvedUsername || 'Guest';
  const problemId = Location.state?.problemId;

  useEffect(() => { outputRef.current = output; }, [output]);

  // If there's no navigation state (e.g. page refresh), check if user has an active room
  useEffect(() => {
    if (Location.state) return;
    if (!user) { navigate('/', { replace: true }); return; }
    api.get('/user/active-room')
      .then(({ data }) => {
        if (data.roomId === roomId) {
          setResolvedUsername(user.username);
          setStateReady(true);
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }));
  }, []);

  function getStub(lang, stubs) {
    return stubs?.find(s => s.language === lang)?.starterCode || '';
  }

  // Load problem if problemId provided
  useEffect(() => {
    if (problemId) {
      setCurrentProblemId(problemId);
      api.get(`/problems/${problemId}`)
        .then(({ data }) => {
          setProblem(data);
          if (!codeRef.current?.trim() && setEditorCodeRef.current) {
            const stub = getStub(selectedLanguage, data.codeStubs);
            if (stub) setEditorCodeRef.current(stub);
          }
        })
        .catch(() => {});
    }
  }, [problemId]);

  useEffect(() => {
    if (!stateReady || authLoading) return;
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket error:', err);
        toast.error('Socket connection failed');
        navigate('/');
      });

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username,
        userId: user?._id || null,
        role: 'editor',
        problemId: problemId || null,
      });

      socketRef.current.on(ACTIONS.JOINED, ({ clients: c, username: joinedUser, socketId, problemId: roomProblemId, creatorSocketId: cid }) => {
        if (joinedUser !== username) {
          toast.success(`${joinedUser} joined`);
        }
        setClients(c);
        if (cid) setCreatorSocketId(cid);
        socketRef.current.emit(ACTIONS.SYNC_CODE, { socketId, roomId });
        if (outputRef.current) {
          socketRef.current.emit('sync-output-single', { socketId, output: outputRef.current, language: selectedLanguage });
        }
        // Load problem for joining user if room has one and we don't have it yet
        if (roomProblemId && !problem) {
          setCurrentProblemId(roomProblemId);
          api.get(`/problems/${roomProblemId}`)
            .then(({ data }) => {
              setProblem(data);
              if (!codeRef.current?.trim() && setEditorCodeRef.current) {
                const stub = getStub(selectedLanguage, data.codeStubs);
                if (stub) setEditorCodeRef.current(stub);
              }
            })
            .catch(() => {});
        }
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: left }) => {
        toast(`${left || 'Someone'} left`, { icon: '👋' });
        setClients(prev => prev.filter(c => c.socketId !== socketId));
      });

      socketRef.current.on(ACTIONS.SYNC_OUTPUT, ({ output: o, language: lang, triggeredBy }) => {
        setOutput(o || '');
        if (lang) setSelectedLanguage(lang);
        setIsCompileWindowOpen(true);
        if (triggeredBy && triggeredBy !== username) {
          toast(`${triggeredBy} ran the code`, { icon: '💻' });
        }
      });

      // Submission results
      socketRef.current.on(ACTIONS.SUBMISSION_RESULT, (result) => {
        setSubmissionResult(result);
        setIsSubmitting(false);
        if (result.status === 'ACCEPTED') {
          toast.success('✅ Accepted!');
        } else {
          toast.error(`❌ ${result.status}`);
        }
      });

      // Kicked from room
      socketRef.current.on(ACTIONS.KICKED, ({ kickedBy }) => {
        if (kickedBy === 'session replaced') {
          toast('Your session was replaced in another tab');
        } else {
          toast.error(`You were removed from the room by ${kickedBy}`);
        }
        // Disable reconnection before disconnecting so the kicked tab
        // doesn't auto-reconnect and re-join the room as a ghost user
        socketRef.current.io.opts.reconnection = false;
        socketRef.current.disconnect();
        navigate('/problems');
      });

      // Problem change broadcast
      socketRef.current.on(ACTIONS.PROBLEM_CHANGED, async ({ problemId: newId, changedBy }) => {
        try {
          const { data } = await api.get(`/problems/${newId}`);
          setProblem(data);
          setCurrentProblemId(newId);
          toast.success(`${changedBy} changed the problem to "${data.title}"`);
          if (!codeRef.current?.trim() && setEditorCodeRef.current) {
            const stub = getStub(selectedLanguage, data.codeStubs);
            if (stub) setEditorCodeRef.current(stub);
          }
        } catch {
          toast.error('Failed to load new problem');
        }
      });
    };

    init();

    // Save code snapshot every 60 seconds
    const saveInterval = setInterval(() => {
      if (socketRef.current && codeRef.current) {
        socketRef.current.emit(ACTIONS.SAVE_CODE, { roomId, code: codeRef.current, language: selectedLanguage });
      }
    }, 60000);

    return () => {
      clearInterval(saveInterval);
      socketRef.current?.disconnect();
    };
  }, [stateReady, authLoading]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        setCompilerHeight(Math.min(Math.max(newHeight, 100), window.innerHeight * 0.8));
      }
      if (isResizingLeft) {
        setLeftPanelWidth(Math.min(Math.max(e.clientX, 150), 500));
      }
      if (isResizingRight) {
        setRightPanelWidth(Math.min(Math.max(window.innerWidth - e.clientX, 200), 600));
      }
    };
    const stopResizing = () => {
      setIsResizing(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, isResizingLeft, isResizingRight]);

  if (!stateReady) {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <span className="text-muted text-sm">Reconnecting to room...</span>
      </div>
    );
  }

  function handleLanguageChange(newLang) {
    const newStub = getStub(newLang, problem?.codeStubs);
    const currentStub = getStub(selectedLanguage, problem?.codeStubs);
    const hasCustomCode = codeRef.current?.trim() && codeRef.current.trim() !== currentStub?.trim();
    setSelectedLanguage(newLang);
    setRunResults(null);
    if (newStub && (!hasCustomCode || window.confirm('Load starter code for this language? This will replace your current code.'))) {
      setEditorCodeRef.current?.(newStub);
    }
  }

  async function runCode() {
    if (!codeRef.current?.trim()) {
      toast.error('Write some code first!');
      return;
    }
    setIsCompiling(true);
    setIsCompileWindowOpen(true);
    setOutput('Running...');

    setupTimerRef.current = setTimeout(() => {
      setOutput('Setting up language environment, please wait...\nThis may take 1-2 minutes the first time this language is used.');
    }, 5000);

    try {
      let result;

      if (currentProblemId) {
        // Run against visible test cases (LeetCode-style)
        const { data } = await api.post(`/problems/${currentProblemId}/run`, {
          code: codeRef.current,
          language: selectedLanguage,
        });
        setRunResults(data.results);
        setActiveTestTab(0);
        result = data.results.map((r, i) => `Test ${i + 1}: ${r.passed ? '✓' : '✗'}`).join('  ');
      } else {
        // No problem loaded — free compile
        const stub = problem?.codeStubs?.find(s => s.language === selectedLanguage);
        const fullCode = stub?.driverCode ? `${codeRef.current}\n\n${stub.driverCode}` : codeRef.current;
        const { data } = await axios.post(`${API_GATEWAY}/compile`, { code: fullCode, language: selectedLanguage, stdin: '' }, { timeout: 120000 });
        result = data.output || data.error || JSON.stringify(data);
      }

      setOutput(result);
      socketRef.current?.emit(ACTIONS.SYNC_OUTPUT, { roomId, output: result, language: selectedLanguage, triggeredBy: username });
      toast.success('Code executed');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Execution failed';
      setOutput(errMsg);
      toast.error('Execution failed');
    } finally {
      clearTimeout(setupTimerRef.current);
      setupTimerRef.current = null;
      setIsCompiling(false);
    }
  }

  function handleKick(targetSocketId) {
    socketRef.current?.emit(ACTIONS.KICK_MEMBER, { roomId, targetSocketId });
  }

  function handleChangeProblem(newProblemId) {
    socketRef.current?.emit(ACTIONS.CHANGE_PROBLEM, { roomId, problemId: newProblemId, username });
    setShowChangeProblem(false);
  }

  async function submitCode() {
    if (!currentProblemId) {
      toast.error('No problem selected. Use "Change Problem" to pick one.');
      return;
    }
    if (!codeRef.current?.trim()) {
      toast.error('Write some code first!');
      return;
    }
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      await api.post(`/problems/${currentProblemId}/submit`, {
        roomId,
        code: codeRef.current,
        language: selectedLanguage,
      });
      toast('Submission queued — result will appear for all users', { icon: '⏳' });
    } catch (err) {
      setIsSubmitting(false);
      toast.error(err.response?.data?.error || 'Submission failed');
    }
  }

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied!');
    } catch {
      toast.error('Could not copy Room ID');
    }
  }

  return (
    <div className={`h-screen bg-bg flex flex-col overflow-hidden${isResizingLeft || isResizingRight || isResizing ? ' select-none' : ''}`}>
      {/* Top Bar */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold font-code text-sm">{'<CodeRome />'}</span>
          {problem && (
            <span className="text-muted text-sm">
              {problem.title}
              <span className={`ml-2 badge-${problem.difficulty}`}>{problem.difficulty}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-surface border border-border text-white rounded px-2 py-1 text-sm focus:outline-none"
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {problem && getStub(selectedLanguage, problem.codeStubs) && (
            <button
              onClick={() => {
                if (window.confirm('Reset to starter code?'))
                  setEditorCodeRef.current?.(getStub(selectedLanguage, problem.codeStubs));
              }}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              ↺ Reset
            </button>
          )}
          <button onClick={runCode} disabled={isCompiling} className="btn-success text-sm px-3 py-1.5">
            {isCompiling ? '⏳ Running...' : '▶ Run'}
          </button>
          {currentProblemId && (
            <button onClick={submitCode} disabled={isSubmitting} className="btn-primary text-sm px-3 py-1.5">
              {isSubmitting ? '⏳ Submitting...' : '● Submit'}
            </button>
          )}
          <button onClick={copyRoomId} className="btn-secondary text-sm px-3 py-1.5">
            Share Room
          </button>
          <button onClick={() => {
            if (socketRef.current && codeRef.current) {
              socketRef.current.emit(ACTIONS.SAVE_CODE, { roomId, code: codeRef.current, language: selectedLanguage });
            }
            navigate('/');
          }} className="btn-danger text-sm px-3 py-1.5">
            Leave
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem Panel */}
        <div
          className="border-r border-border flex flex-col overflow-hidden flex-shrink-0 relative"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <div
            onMouseDown={(e) => { e.preventDefault(); setIsResizingLeft(true); }}
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-primary transition-colors z-10"
          />
          {/* Members */}
          <div className="p-3 border-b border-border">
            <div className="text-xs text-muted font-medium mb-2 uppercase tracking-wide">Members ({clients.length})</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {clients.map(c => (
                <Client
                  key={c.socketId}
                  username={c.username}
                  socketId={c.socketId}
                  currentUser={username}
                  isCreator={creatorSocketId === socketRef.current?.id}
                  onKick={handleKick}
                />
              ))}
            </div>
          </div>

          {/* Change Problem */}
          <div className="px-3 py-2 border-b border-border">
            <button
              onClick={() => setShowChangeProblem(true)}
              className="btn-secondary text-xs w-full"
            >
              Change Problem
            </button>
          </div>

          {/* Problem Description */}
          <div className="flex-1 overflow-y-auto p-3">
            {problem ? (
              <div>
                <h3 className="font-semibold text-sm mb-2">{problem.title}</h3>
                <div className="prose prose-invert prose-sm max-w-none text-xs text-muted">
                  <ReactMarkdown>{problem.description}</ReactMarkdown>
                </div>
                {problem.testCases?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-muted mb-1">Examples:</div>
                    {problem.testCases.slice(0, 2).map((tc, i) => (
                      <div key={i} className="bg-bg rounded p-2 text-xs font-code mb-2">
                        {tc.input && <div><span className="text-muted">In:</span> {tc.input}</div>}
                        <div><span className="text-muted">Out:</span> <span className="text-success">{tc.expectedOutput}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted text-xs text-center py-8">
                No problem loaded.
                <br />
                <a href="/problems" className="text-primary hover:underline">Browse problems →</a>
              </div>
            )}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => { codeRef.current = code; }}
            onEditorInit={(setter) => { setEditorCodeRef.current = setter; }}
          />

          {/* Compiler Output (resizable) */}
          <div
            className={`border-t border-border bg-surface flex-shrink-0 overflow-hidden ${isCompileWindowOpen ? '' : 'hidden'}`}
            style={{
              height: `${compilerHeight}px`,
              transition: isResizing ? 'none' : 'height 0.2s ease',
            }}
          >
            <div
              onMouseDown={() => setIsResizing(true)}
              className="h-1.5 cursor-ns-resize bg-border hover:bg-primary transition-colors"
            />
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
              <span className="text-sm font-medium">Output</span>
              <button onClick={() => { setIsCompileWindowOpen(false); setRunResults(null); }} className="text-muted hover:text-white text-sm">✕</button>
            </div>

            {runResults ? (
              <div className="flex flex-col overflow-hidden" style={{ maxHeight: `${compilerHeight - 52}px` }}>
                {/* Test tabs */}
                <div className="flex gap-1 px-4 pb-2 flex-shrink-0">
                  {runResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestTab(i)}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        activeTestTab === i
                          ? r.passed ? 'bg-green-900 text-green-300 border border-green-600' : 'bg-red-900 text-red-300 border border-red-600'
                          : 'bg-surface text-muted border border-border hover:text-white'
                      }`}
                    >
                      {r.passed ? '✓' : '✗'} Case {i + 1}
                    </button>
                  ))}
                </div>
                {/* Test detail */}
                {runResults[activeTestTab] && (
                  <div className="px-4 pb-3 overflow-y-auto text-xs font-code space-y-3">
                    <div>
                      <div className="text-muted mb-1">Input</div>
                      <pre className="bg-bg rounded p-2 text-white">{runResults[activeTestTab].input || '(none)'}</pre>
                    </div>
                    <div>
                      <div className="text-muted mb-1">Expected Output</div>
                      <pre className="bg-bg rounded p-2 text-green-400">{runResults[activeTestTab].expected}</pre>
                    </div>
                    <div>
                      <div className="text-muted mb-1">Your Output</div>
                      <pre className={`bg-bg rounded p-2 ${runResults[activeTestTab].passed ? 'text-green-400' : 'text-red-400'}`}>
                        {runResults[activeTestTab].actual || '(no output)'}
                      </pre>
                    </div>
                    {runResults[activeTestTab].error && (
                      <div>
                        <div className="text-muted mb-1">Error</div>
                        <pre className="bg-bg rounded p-2 text-red-400">{runResults[activeTestTab].error}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <pre className="px-4 pb-3 text-sm font-code text-green-400 overflow-y-auto" style={{ maxHeight: `${compilerHeight - 60}px` }}>
                {output || 'No output yet.'}
              </pre>
            )}
          </div>

          {!isCompileWindowOpen && (
            <button
              onClick={() => setIsCompileWindowOpen(true)}
              className="border-t border-border px-4 py-1.5 text-xs text-muted hover:text-white text-left flex-shrink-0"
            >
              ▲ Output
            </button>
          )}
        </div>

        {/* Right: Chat / AI / Video */}
        <div
          className="border-l border-border flex flex-col overflow-hidden flex-shrink-0 relative"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div
            onMouseDown={(e) => { e.preventDefault(); setIsResizingRight(true); }}
            className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-primary transition-colors z-10"
          />
          {/* Tabs */}
          <div className="border-b border-border flex flex-shrink-0">
            {['chat', 'ai', 'video'].map(tab => (
              <button
                key={tab}
                onClick={() => setRightPanel(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  rightPanel === tab
                    ? 'text-white border-b-2 border-primary'
                    : 'text-muted hover:text-white'
                }`}
              >
                {tab === 'chat' ? '💬 Chat' : tab === 'ai' ? '🤖 AI' : '🎥 Video'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanel === 'chat' && (
              <ChatPanel socketRef={socketRef} roomId={roomId} username={username} />
            )}
            {rightPanel === 'ai' && (
              <AIPanel
                socketRef={socketRef}
                roomId={roomId}
                problemId={problemId}
                code={codeRef.current}
                language={selectedLanguage}
              />
            )}
            {rightPanel === 'video' && (
              <div className="p-3">
                <VideoPanel
                  socketRef={socketRef}
                  roomId={roomId}
                  username={username}
                  clients={clients}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Problem Modal */}
      {showChangeProblem && (
        <ChangeProblemModal
          onSelect={handleChangeProblem}
          onClose={() => setShowChangeProblem(false)}
        />
      )}

      {/* Submission Result Overlay */}
      {submissionResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card p-8 max-w-lg w-full">
            <div className={`text-center mb-6 ${submissionResult.status === 'ACCEPTED' ? 'text-success' : 'text-danger'}`}>
              <div className="text-5xl mb-3">
                {submissionResult.status === 'ACCEPTED' ? '✅' : '❌'}
              </div>
              <h2 className="text-2xl font-bold">{submissionResult.status}</h2>
            </div>

            {submissionResult.results && (
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {submissionResult.results.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between rounded p-2 text-sm ${r.passed ? 'bg-green-950 border border-success/30' : 'bg-red-950 border border-danger/30'}`}>
                    <span>Test {i + 1}: {r.passed ? '✓ Passed' : '✗ Failed'}</span>
                    {r.time && <span className="text-muted text-xs">{r.time}ms</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSubmissionResult(null)} className="btn-secondary flex-1">
                Close
              </button>
              {submissionResult.status === 'ACCEPTED' && (
                <button onClick={() => {
                  setSubmissionResult(null);
                  setRightPanel('ai');
                  socketRef.current?.emit(ACTIONS.AI_REQUEST, {
                    roomId, type: 'review', problemId: currentProblemId, code: codeRef.current, language: selectedLanguage,
                  });
                }} className="btn-primary flex-1">
                  🤖 AI Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
