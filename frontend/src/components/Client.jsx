import React from 'react';
import Avatar from 'react-avatar';

function Client({ username, socketId, currentUser, isCreator, onKick }) {
  const isMe = username === currentUser;

  return (
    <div className="flex items-center justify-between gap-2 px-1 py-0.5 rounded hover:bg-surface/50 group">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={username.toString()} size={28} round="6px" />
        <span className="text-sm truncate">
          {username.toString()}{' '}
          {isMe && <span className="text-primary text-xs font-semibold">(you)</span>}
        </span>
      </div>
      {isCreator && !isMe && (
        <button
          onClick={() => onKick(socketId)}
          title="Remove from room"
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 text-xs leading-none transition-opacity flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Client;
