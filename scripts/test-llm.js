require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const executor = require('../services/requestExecutor');

async function main() {
  console.log('Calling requestExecutor.execute() via Anthropic...\n');

  const result = await executor.execute({
    capability: 'summarize_cheap',
    agent: 'test-agent',
    project: 'system-validation',
    estimatedTokens: 50,
    payload: {
      prompt: 'Say hello',
    },
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
