import { useState, useEffect, useRef } from 'react';
import { ACTIONS } from '../../Actions';

export default function ChatPanel({ socketRef, roomId, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.on(ACTIONS.CHAT_HISTORY, ({ messages: history }) => {
      setMessages(history);
    });

    socket.on(ACTIONS.CHAT_MESSAGE, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // AI messages also appear in chat
    socket.on(ACTIONS.AI_STREAM, ({ token, start, type }) => {
      if (start) {
        setMessages(prev => [...prev, {
          _id: `ai-${Date.now()}`,
          username: `AI (${type})`,
          content: '',
          type: 'ai',
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

    socket.on(ACTIONS.AI_DONE, () => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.streaming) {
          return [...prev.slice(0, -1), { ...last, streaming: false }];
        }
        return prev;
      });
    });

    return () => {
      socket.off(ACTIONS.CHAT_HISTORY);
      socket.off(ACTIONS.CHAT_MESSAGE);
      socket.off(ACTIONS.AI_STREAM);
      socket.off(ACTIONS.AI_DONE);
    };
  }, [socketRef.current]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current?.emit(ACTIONS.CHAT_SEND, { roomId, content: input.trim() });
    setInput('');
  }

  function getMessageStyle(msg) {
    if (msg.type === 'ai') return 'bg-purple-950 border-l-2 border-ai';
    if (msg.type === 'system') return 'bg-surface text-muted italic';
    if (msg.username === username) return 'bg-blue-950 border-l-2 border-primary';
    return 'bg-surface border-l-2 border-border';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border text-sm font-medium text-muted">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted text-sm py-8">
            No messages yet. Say hi!
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg._id || i} className={`rounded p-2 text-sm ${getMessageStyle(msg)}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`font-semibold text-xs ${msg.type === 'ai' ? 'text-ai' : msg.username === username ? 'text-primary' : 'text-white'}`}>
                {msg.username}
              </span>
              {msg.createdAt && (
                <span className="text-muted text-xs">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {msg.streaming && <span className="text-ai text-xs animate-pulse">●</span>}
            </div>
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-border p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-bg border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="submit" className="btn-primary text-sm px-3 py-1.5">
          Send
        </button>
      </form>
    </div>
  );
}
