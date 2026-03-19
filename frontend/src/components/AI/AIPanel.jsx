import { useState, useEffect, useRef } from 'react';
import { ACTIONS } from '../../Actions';

const AI_TYPES = [
  { key: 'hint', label: '💡 Get Hint' },
  { key: 'review', label: '🔍 Code Review' },
  { key: 'explain', label: '📖 Explain Code' },
  { key: 'interview', label: '🎤 Interview Mode' },
  { key: 'generate', label: '✨ Generate Problem' },
];

export default function AIPanel({ socketRef, roomId, problemId, code, language }) {
  const [messages, setMessages] = useState([]);
  const [activeType, setActiveType] = useState('hint');
  const [hintCount, setHintCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [interviewInput, setInterviewInput] = useState('');
  const [interviewHistory, setInterviewHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    socket.on(ACTIONS.AI_STREAM, ({ token, start, type }) => {
      if (start) {
        setLoading(true);
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          type,
          content: '',
          streaming: true,
        }]);
      } else {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming) {
            return [...prev.slice(0, -1), { ...last, content: last.content + token }];
          }
          return prev;
        });
      }
    });

    socket.on(ACTIONS.AI_DONE, ({ response }) => {
      setLoading(false);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.streaming) {
          return [...prev.slice(0, -1), { ...last, streaming: false }];
        }
        return prev;
      });
      // For interview mode, add to conversation history
      if (activeType === 'interview' && response) {
        setInterviewHistory(prev => [...prev, { role: 'assistant', content: response }]);
      }
    });

    socket.on(ACTIONS.AI_ERROR, ({ error }) => {
      setLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'error',
        content: error,
      }]);
    });

    return () => {
      socket.off(ACTIONS.AI_STREAM);
      socket.off(ACTIONS.AI_DONE);
      socket.off(ACTIONS.AI_ERROR);
    };
  }, [socketRef.current, activeType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendAIRequest(type, extraPayload = {}) {
    if (loading) return;
    setLoading(true);

    const newHintCount = type === 'hint' ? hintCount + 1 : hintCount;
    if (type === 'hint') setHintCount(newHintCount);

    socketRef.current?.emit(ACTIONS.AI_REQUEST, {
      roomId,
      type,
      problemId,
      code,
      language,
      hintNumber: newHintCount,
      ...extraPayload,
    });

    // Add user message to panel
    const userMsg = type === 'interview' && extraPayload.userResponse
      ? { id: Date.now(), role: 'user', content: extraPayload.userResponse }
      : { id: Date.now(), role: 'request', content: `Requesting ${type}...` };
    setMessages(prev => [...prev, userMsg]);
  }

  function sendInterviewResponse(e) {
    e.preventDefault();
    if (!interviewInput.trim() || loading) return;

    const userResponse = interviewInput.trim();
    const newHistory = [...interviewHistory, { role: 'user', content: userResponse }];
    setInterviewHistory(newHistory);
    setInterviewInput('');

    sendAIRequest('interview', { messages: newHistory, userResponse });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <div className="text-sm font-medium text-muted mb-2">AI Pair Programmer</div>
        <div className="flex flex-wrap gap-1">
          {AI_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                activeType === t.key
                  ? 'border-ai text-ai bg-purple-950'
                  : 'border-border text-muted hover:border-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted text-xs py-8">
            AI responses are shared with all room users.
            <br />Select a mode above to get started.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded p-3 text-sm ${
              msg.role === 'assistant' ? 'bg-purple-950 border border-ai/30' :
              msg.role === 'user' ? 'bg-blue-950 border border-primary/30' :
              msg.role === 'error' ? 'bg-red-950 border border-danger/30 text-danger' :
              'bg-surface border border-border text-muted italic'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-ai text-xs font-semibold">🤖 AI</span>
                {msg.type && <span className="text-xs text-muted capitalize">({msg.type})</span>}
                {msg.streaming && <span className="text-ai text-xs animate-pulse">●</span>}
              </div>
            )}
            <pre className="whitespace-pre-wrap break-words font-ui">{msg.content}</pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Action area */}
      <div className="border-t border-border p-3">
        {activeType === 'interview' ? (
          <form onSubmit={sendInterviewResponse} className="space-y-2">
            {interviewHistory.length === 0 && (
              <button
                type="button"
                onClick={() => sendAIRequest('interview')}
                disabled={loading}
                className="btn-primary w-full text-sm py-2"
              >
                {loading ? 'Starting interview...' : '🎤 Start Interview'}
              </button>
            )}
            {interviewHistory.length > 0 && (
              <>
                <input
                  value={interviewInput}
                  onChange={(e) => setInterviewInput(e.target.value)}
                  placeholder="Your answer..."
                  disabled={loading}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ai"
                />
                <button type="submit" disabled={loading || !interviewInput.trim()} className="btn-primary w-full text-sm py-2">
                  {loading ? 'Thinking...' : 'Send Response'}
                </button>
              </>
            )}
          </form>
        ) : (
          <button
            onClick={() => sendAIRequest(activeType)}
            disabled={loading}
            className="w-full py-2 text-sm rounded border border-ai text-ai hover:bg-purple-950 transition-colors disabled:opacity-50"
          >
            {loading ? '🤖 AI is thinking...' : AI_TYPES.find(t => t.key === activeType)?.label}
            {activeType === 'hint' && hintCount > 0 && (
              <span className="ml-2 text-xs text-muted">({hintCount} used)</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
