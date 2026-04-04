import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ACTIONS } from '../../Actions';

const AI_TYPES = [
  { key: 'hint',       label: '💡 Get Hint' },
  { key: 'review',     label: '🔍 Code Review' },
  { key: 'explain',    label: '📖 Explain Code' },
  { key: 'interview',  label: '🎤 Interview Mode' },
  { key: 'complexity', label: '📊 Check Complexity' },
];

// ─── Complexity chart ────────────────────────────────────────────────────────

const N_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const COMPLEXITY_FNS = {
  'O(1)':       () => 1,
  'O(log n)':   (n) => parseFloat(Math.log2(n).toFixed(2)),
  'O(n)':       (n) => n,
  'O(n log n)': (n) => parseFloat((n * Math.log2(n)).toFixed(2)),
  'O(n²)':      (n) => n * n,
};

const COMPLEXITY_COLORS = {
  'O(1)':       '#22c55e',
  'O(log n)':   '#3b82f6',
  'O(n)':       '#f59e0b',
  'O(n log n)': '#f97316',
  'O(n²)':      '#ef4444',
};

// Map AI output strings to canonical keys
function normaliseComplexity(raw = '') {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (s === 'o(1)')                              return 'O(1)';
  if (s === 'o(logn)')                           return 'O(log n)';
  if (s === 'o(n)')                              return 'O(n)';
  if (s === 'o(nlogn)' || s === 'o(nlog(n))')   return 'O(n log n)';
  if (s === 'o(n^2)' || s === 'o(n2)' || s === 'o(n²)') return 'O(n²)';
  return raw; // keep original if unknown — still shown in badge
}

const CHART_DATA = N_RANGE.map((n) => {
  const point = { n };
  for (const [key, fn] of Object.entries(COMPLEXITY_FNS)) point[key] = fn(n);
  return point;
});

function ComplexityBadge({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded border" style={{ borderColor: color + '55', background: color + '18' }}>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

function ComplexityResult({ content }) {
  let parsed = null;
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  } catch {
    // fall through to raw markdown
  }

  if (!parsed) {
    return <MarkdownContent content={content} />;
  }

  const timeKey  = normaliseComplexity(parsed.timeComplexity);
  const spaceKey = normaliseComplexity(parsed.spaceComplexity);
  const timeColor  = COMPLEXITY_COLORS[timeKey]  ?? '#a78bfa';
  const spaceColor = COMPLEXITY_COLORS[spaceKey] ?? '#67e8f9';

  return (
    <div className="space-y-3">
      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        <ComplexityBadge label="Time"  value={parsed.timeComplexity}  color={timeColor} />
        <ComplexityBadge label="Space" value={parsed.spaceComplexity} color={spaceColor} />
      </div>

      {/* Explanation */}
      {parsed.explanation && (
        <div className="text-xs text-foreground leading-relaxed">
          <MarkdownContent content={parsed.explanation} />
        </div>
      )}

      {/* Breakdown table */}
      {parsed.breakdown?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="text-left py-1 pr-3">Operation</th>
                <th className="text-left py-1 pr-3">Time</th>
                <th className="text-left py-1">Space</th>
              </tr>
            </thead>
            <tbody>
              {parsed.breakdown.map((row, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-1 pr-3 text-foreground">{row.operation}</td>
                  <td className="py-1 pr-3 font-mono text-orange-300">{row.time ?? '—'}</td>
                  <td className="py-1 font-mono text-cyan-300">{row.space ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Growth chart */}
      <div>
        <p className="text-xs text-muted mb-1">Growth curve (n = 1 → 10)</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={CHART_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <XAxis dataKey="n" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #333', fontSize: 11 }}
              labelStyle={{ color: '#aaa' }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {Object.entries(COMPLEXITY_FNS).map(([key]) => {
              const isTime  = key === timeKey;
              const isSpace = key === spaceKey;
              const color = COMPLEXITY_COLORS[key];
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={isTime || isSpace ? 3 : 1}
                  strokeDasharray={isSpace && !isTime ? '5 3' : undefined}
                  dot={false}
                  opacity={isTime || isSpace ? 1 : 0.35}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted mt-1">
          <span style={{ color: timeColor }}>━━</span> time &nbsp;
          <span style={{ color: spaceColor }}>╌╌</span> space
        </p>
      </div>
    </div>
  );
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          return inline ? (
            <code className="bg-black/40 px-1 py-0.5 rounded text-xs font-mono text-green-300" {...props}>
              {children}
            </code>
          ) : (
            <pre className="bg-black/40 rounded p-2 overflow-x-auto text-xs font-mono leading-relaxed my-2">
              <code className={className} {...props}>{children}</code>
            </pre>
          );
        },
        h1: ({ children }) => <h1 className="text-base font-bold text-foreground mb-1 mt-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-semibold text-foreground mb-1 mt-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold text-foreground mb-1 mt-2">{children}</h3>,
        p:  ({ children }) => <p className="text-xs leading-relaxed mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="text-xs list-disc pl-4 space-y-0.5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="text-xs list-decimal pl-4 space-y-0.5 mb-2">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-ai/50 pl-3 text-muted italic my-2">{children}</blockquote>
        ),
        table: ({ children }) => (
          <table className="w-full text-xs border-collapse my-2">{children}</table>
        ),
        th: ({ children }) => (
          <th className="text-left border-b border-border py-1 pr-2 text-muted font-medium">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border/40 py-1 pr-2">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function AIPanel({ socketRef, roomId, problemId, code, language }) {
  const [messages, setMessages]             = useState([]);
  const [activeType, setActiveType]         = useState('hint');
  const [hintCount, setHintCount]           = useState(0);
  const [loading, setLoading]               = useState(false);
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
          id: Date.now(), role: 'assistant', type, content: '', streaming: true,
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
        if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }];
        return prev;
      });
      if (activeType === 'interview' && response) {
        setInterviewHistory(prev => [...prev, { role: 'assistant', content: response }]);
      }
    });

    socket.on(ACTIONS.AI_ERROR, ({ error }) => {
      setLoading(false);
      setMessages(prev => [...prev, { id: Date.now(), role: 'error', content: error }]);
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
      roomId, type, problemId, code, language,
      hintNumber: newHintCount,
      ...extraPayload,
    });

    const userMsg = type === 'interview' && extraPayload.userResponse
      ? { id: Date.now(), role: 'user', content: extraPayload.userResponse }
      : { id: Date.now(), role: 'request', content: `Requesting ${type}…` };
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

  function renderMessageBody(msg) {
    if (msg.streaming) {
      return (
        <span className="text-xs text-muted italic">
          {msg.content || 'Thinking'}
          <span className="text-ai animate-pulse">●</span>
        </span>
      );
    }
    if (msg.type === 'complexity') {
      return <ComplexityResult content={msg.content} />;
    }
    return <MarkdownContent content={msg.content} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Type selector */}
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

      {/* Messages */}
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
              msg.role === 'user'      ? 'bg-blue-950 border border-primary/30' :
              msg.role === 'error'     ? 'bg-red-950 border border-danger/30 text-danger' :
              'bg-surface border border-border text-muted italic'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-ai text-xs font-semibold">🤖 AI</span>
                {msg.type && (
                  <span className="text-xs text-muted capitalize">({msg.type})</span>
                )}
              </div>
            )}
            {renderMessageBody(msg)}
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
                {loading ? 'Starting interview…' : '🎤 Start Interview'}
              </button>
            )}
            {interviewHistory.length > 0 && (
              <>
                <input
                  value={interviewInput}
                  onChange={(e) => setInterviewInput(e.target.value)}
                  placeholder="Your answer…"
                  disabled={loading}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ai"
                />
                <button
                  type="submit"
                  disabled={loading || !interviewInput.trim()}
                  className="btn-primary w-full text-sm py-2"
                >
                  {loading ? 'Thinking…' : 'Send Response'}
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
            {loading
              ? '🤖 AI is thinking…'
              : AI_TYPES.find(t => t.key === activeType)?.label}
            {activeType === 'hint' && hintCount > 0 && (
              <span className="ml-2 text-xs text-muted">({hintCount} used)</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
