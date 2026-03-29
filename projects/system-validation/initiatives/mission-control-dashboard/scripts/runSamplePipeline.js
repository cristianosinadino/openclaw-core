const path = require('path');
const agentLogger = require(path.resolve(__dirname, '../../../../../services/agentLogger'));
const memoryService = require(path.resolve(__dirname, '../../../../../services/memoryService'));

const PROJECT = 'system-validation';

async function logStage({ agent, stage, title, details, mirror = false, memoryType = 'journal', metadata = {} }) {
  await agentLogger.logEvent({
    agent,
    project: PROJECT,
    stage,
    title,
    details,
    mirrorToMemory: mirror,
    memoryType,
    metadata,
  });
}

async function run() {
  console.log('▶️  Mission Control sample pipeline starting...');

  await logStage({
    agent: 'orchestrator',
    stage: 'INPUT',
    title: 'Captured dashboard requirements',
    details: 'Parsed mission brief for memory, timeline, instrumentation, API, and UI.',
    mirror: true,
  });

  await agentLogger.logDecision({
    agent: 'orchestrator',
    project: PROJECT,
    stage: 'PLAN',
    title: 'Plan baseline architecture',
    details: 'Sequence: scaffold domain → services → API → UI → sample pipeline.',
    metadata: { focus: ['memory', 'timeline', 'ui'] },
  });

  await logStage({
    agent: 'orchestrator',
    stage: 'PROCESS',
    title: 'Allocated agents',
    details: 'Builder on services/UI, Validator on telemetry, Action agent on pipeline run.',
    mirror: true,
  });

  await logStage({
    agent: 'builder',
    stage: 'EXECUTE',
    title: 'Implemented services + API',
    details: 'memoryService, agentLogger, timelineService, REST layer.',
    metadata: { files: ['services/*.js', 'server.js'] },
    mirror: true,
  });

  await logStage({
    agent: 'builder',
    stage: 'EXECUTE',
    title: 'Created Mission Control UI',
    details: 'Static assets under /public with project/memory/timeline view.',
    metadata: { files: ['public/index.html', 'public/app.js'] },
  });

  await logStage({
    agent: 'validator',
    stage: 'VALIDATE',
    title: 'Smoke tested timeline + memory',
    details: 'Queried services to ensure entries render; dedupe confirmed.',
    metadata: { checks: ['timeline', 'memory'] },
    mirror: true,
  });

  await agentLogger.logError({
    agent: 'validator',
    project: PROJECT,
    stage: 'VALIDATE',
    title: 'Handled sample validation warning',
    details: 'Detected duplicate log entry during dry run, dedupe confirmed operational.',
    metadata: { resolved: true },
  });

  await logStage({
    agent: 'orchestrator',
    stage: 'STORE',
    title: 'Persisted telemetry',
    details: 'Stored logs in /logs/agents and long-term summary.',
    mirror: true,
    memoryType: 'long-term',
  });

  await logStage({
    agent: 'action',
    stage: 'ACTION',
    title: 'Dashboard ready for consumption',
    details: 'API endpoints and UI available at server.js (port 4141).',
    mirror: true,
  });

  await memoryService.writeMemory({
    agent: 'orchestrator',
    project: PROJECT,
    type: 'long-term',
    content: 'Mission Control sample pipeline executed to seed telemetry.',
    metadata: { script: path.relative(process.cwd(), __filename) },
  });

  console.log('✅  Sample pipeline complete.');
}

run().catch((err) => {
  console.error('Pipeline failed', err);
  process.exit(1);
});
