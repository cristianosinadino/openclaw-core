const fs = require('fs/promises');
const requestExecutor = require('../../../../../services/requestExecutor');
const OUTPUT_PATH = './output.json';

async function run() {
    const input = 'OpenClaw helps run AI workflows';
    const processResult = await requestExecutor.execute({
        capability: 'summarize_cheap',
        agent: 'summarizer',
        project: 'system-validation',
        payload: { operation: 'summarize', input },
        estimatedTokens: 50,
    });
    const summary = (processResult.response.text || '').trim();
    if (!summary) throw new Error('VALIDATE failed: summary is empty');
    await fs.writeFile(OUTPUT_PATH, JSON.stringify({ summary }, null, 2));
    console.log('ACTION: pipeline completed');
}

run().catch(err => console.error('Error:', err.message));