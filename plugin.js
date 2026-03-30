'use strict';

const { executePrompt } = require('./services/promptExecutor');

const WORKFLOWS = [
  {
    name: 'run-salesforce-validation',
    description: 'Run Salesforce Account org validation',
    prompt: 'run salesforce validation',
  },
  {
    name: 'run-contact-validation',
    description: 'Run Contact org validation',
    prompt: 'run contact validation',
  },
  {
    name: 'run-account-gap',
    description: 'Run Account vs spec gap analysis',
    prompt: 'run account gap analysis',
  },
];

/** @param {import('openclaw/plugin-sdk/core').OpenClawPluginApi} api */
async function activate(api) {
  for (const { name, description, prompt } of WORKFLOWS) {
    api.registerCommand({
      name,
      description,
      acceptsArgs: false,
      requireAuth: false,
      handler: async () => {
        try {
          const result = await executePrompt({ prompt });
          if (result.status === 'ok') {
            const lines = [result.output];
            if (result.outputFile) lines.push(`→ ${result.outputFile}`);
            return { text: lines.join('\n') };
          }
          return { text: `Workflow error: ${result.output || 'unknown error'}`, isError: true };
        } catch (err) {
          return { text: `Plugin error: ${err.message}`, isError: true };
        }
      },
    });
  }
}

module.exports = { activate };
