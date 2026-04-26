require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter }   = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter }  = require('@bull-board/express');

const logger               = require('./config/logger');
const compileRoutes        = require('./routes/compile');
const { CompilationQueue, SubmissionQueue, ResultQueue } = require('./queues/index');
const startCompilationWorker = require('./workers/compilationWorker');
const startSubmissionWorker  = require('./workers/submissionWorker');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [
    new BullMQAdapter(CompilationQueue),
    new BullMQAdapter(SubmissionQueue),
    new BullMQAdapter(ResultQueue),
  ],
  serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());
app.use('/', compileRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`Running on port ${PORT}`);
  logger.info(`Bull Board: http://localhost:${PORT}/admin/queues`);
  startCompilationWorker();
  startSubmissionWorker();
});
