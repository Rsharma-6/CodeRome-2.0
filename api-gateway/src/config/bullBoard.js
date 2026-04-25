const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { CompilationQueue, SubmissionQueue, AIQueue } = require('../queues/index');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(CompilationQueue),
    new BullMQAdapter(SubmissionQueue),
    new BullMQAdapter(AIQueue),
  ],
  serverAdapter,
});

module.exports = serverAdapter;
