const fs = require('fs/promises');
const path = require('path');
const requestExecutor = require('../../../../../services/requestExecutor');

const TOKEN_USAGE_PATH = path.join(__dirname, '../../../../../data/runtime/token-usage.json');
const PIPELINE_OUTPUT_PATH = path.join(__dirname, '../data/minimal-pipeline-output.json');

async function resetBudgets() {
  await fs.writeFile(TOKEN_USAGE_PATH, '{}', 'utf8');
}

async function runMinimalPipeline() {
  console.log('--- Minimal pipeline (system-validation) ---');
  const input = 'Mission Control must remain observable even when workloads spike.';
  console.log('INPUT:', input);
  const processResult = await requestExecutor.execute({
    capability: 'summarize_cheap',
    agent: 'summarizer',
    project: 'system-validation',
    payload: { operation: 'summarize', input },
    estimatedTokens: 150,
  });
  const summary = (processResult.response.text || '').trim();
  if (!summary) {
    throw new Error('VALIDATE failed: summary empty');
  }
  console.log('PROCESS OUTPUT:', summary);
  const payload = {
    input,
    summary,
    model: processResult.model,
    capability: processResult.capability,
    timestamp: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(PIPELINE_OUTPUT_PATH), { recursive: true });
  await fs.writeFile(PIPELINE_OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log('STORE:', path.relative(process.cwd(), PIPELINE_OUTPUT_PATH));
  console.log('ACTION: success');
  return payload;
}

async function rateLimitScenario() {
  console.log('\n--- Rate limit scenario ---');
  try {
    await requestExecutor.execute({
      capability: 'reasoning_high',
      agent: 'parser',
      project: 'system-validation',
      payload: { operation: 'summarize', input: 'Rate limit test' },
      estimatedTokens: 200000,
    });
  } catch (err) {
    console.log('Throttle triggered:', err.message);
  }
}

async function fallbackScenario() {
  console.log('\n--- Fallback scenario ---');
  const result = await requestExecutor.execute({
    capability: 'reasoning_high',
    agent: 'orchestrator',
    project: 'system-validation',
    payload: {
      operation: 'summarize',
      input: 'Fallback should skip first candidate.',
      simulateFailures: ['gpt-5.1-codex'],
    },
    estimatedTokens: 400,
  });
  console.log('Fallback resolved with model:', result.model);
}

async function budgetScenario() {
  console.log('\n--- Budget downgrade scenario ---');
  await resetBudgets();
  await requestExecutor.execute({
    capability: 'reasoning_high',
    agent: 'orchestrator',
    project: 'system-validation',
    payload: { operation: 'summarize', input: 'Initial budget draw' },
    estimatedTokens: 25000,
  });
  const downgraded = await requestExecutor.execute({
    capability: 'reasoning_high',
    agent: 'orchestrator',
    project: 'system-validation',
    payload: { operation: 'summarize', input: 'Trigger downgrade' },
    estimatedTokens: 40000,
  });
  console.log('Downgraded capability handled by model:', downgraded.model, 'capability:', downgraded.capability);
}

async function main() {
  await resetBudgets();
  await runMinimalPipeline();
  await resetBudgets();
  await rateLimitScenario();
  await resetBudgets();
  await fallbackScenario();
  await budgetScenario();
}

main().catch((err) => {
  console.error('Validation script failed', err);
  process.exit(1);
});
