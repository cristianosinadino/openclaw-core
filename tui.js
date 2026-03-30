'use strict';

require('dotenv').config();

const readline = require('readline');
const { executePrompt } = require('./services/promptExecutor');
const requestExecutor = require('./services/requestExecutor');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'openclaw> ',
});

async function handleInput(input) {
  const prompt = input.trim();
  if (!prompt) return;

  // 1. Try workflow first
  const result = await executePrompt({ prompt });

  if (result.status !== 'no_workflow') {
    console.log(result.output);
    if (result.outputFile) console.log(`→ ${result.outputFile}`);
    return;
  }

  // 2. Fall back to LLM for conversational prompts
  try {
    const llmResult = await requestExecutor.execute({
      capability: 'summarize_cheap',
      agent: 'tui',
      project: 'global',
      payload: { prompt },
      estimatedTokens: 500,
    });
    if (llmResult.status === 'ok') {
      console.log(llmResult.response.text);
    } else {
      console.log(`[${llmResult.status}] ${llmResult.reason || 'no response'}`);
    }
  } catch (err) {
    console.error('LLM error:', err.message);
  }
}

rl.prompt();

rl.on('line', async (line) => {
  if (line.trim() === 'exit') {
    rl.close();
    return;
  }
  await handleInput(line);
  rl.prompt();
});

rl.on('close', () => {
  console.log('bye');
  process.exit(0);
});
