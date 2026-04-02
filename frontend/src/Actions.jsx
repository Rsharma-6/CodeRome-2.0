export const ACTIONS = {
  JOIN: 'join',
  JOINED: 'joined',
  DISCONNECTED: 'disconnected',
  CODE_CHANGE: 'code-change',
  SYNC_CODE: 'sync-code',
  LEAVE: 'leave',
  SYNC_OUTPUT: 'sync-output',
  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',
  // AI
  AI_REQUEST: 'ai:request',
  AI_STREAM: 'ai:stream',
  AI_DONE: 'ai:done',
  AI_ERROR: 'ai:error',
  // Video
  VIDEO_JOIN: 'video:join',
  VIDEO_OFFER: 'video:offer',
  VIDEO_ANSWER: 'video:answer',
  VIDEO_ICE_CANDIDATE: 'video:ice-candidate',
  VIDEO_LEAVE: 'video:leave',
  // Submission
  SUBMISSION_RESULT: 'quest:result',
  // Problem
  CHANGE_PROBLEM: 'change-problem',
  PROBLEM_CHANGED: 'problem:changed',
  // Room management
  KICK_MEMBER: 'kick:member',
  KICKED: 'kicked',
  SAVE_CODE: 'save-code',
};
