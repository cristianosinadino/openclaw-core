'use strict';

const path = require('path');
const { appendFile, mkdirSync } = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');

const { resolveWorkflow } = require('./workflowResolver');

const execAsync = promisify(exec);

const PROJECT_ROOT = path.join(__dirname, '..');
const LOG_PATH = path.join(PROJECT_ROOT, 'logs/workflow-runs.log');

// Ensure logs directory exists at module load time
mkdirSync(path.join(PROJECT_ROOT, 'logs'), { recursive: true });

const OUTPUT_FILE_MAP = {
  'salesforceOrgValidation.js': 'salesforce_org_validation.json',
  'contactOrgValidation.js': 'contact_org_validation.json',
};

function detectOutputFile(command) {
  for (const [script, file] of Object.entries(OUTPUT_FILE_MAP)) {
    if (command.includes(script)) return file;
  }
  return null;
}

function appendLog(entry) {
  appendFile(LOG_PATH, JSON.stringify(entry) + '\n', (err) => {
    if (err) console.error('[logging] failed to write to', LOG_PATH, err.message);
  });
}

async function executePrompt({ prompt, orgAlias } = {}) {
  const timestamp = new Date().toISOString();
  const sfOrg = orgAlias || process.env.SF_ORG || 'sina-fsc';
  const workflow = resolveWorkflow(prompt);

  if (!workflow) {
    appendLog({ timestamp, prompt, workflow: null, status: 'no_workflow' });
    return { status: 'no_workflow', workflow: null, orgAlias: sfOrg, output: '', outputFile: null, timestamp };
  }

  try {
    const { stdout } = await execAsync(workflow.command, {
      cwd: PROJECT_ROOT,
      env: { ...process.env, SF_ORG: sfOrg },
    });
    const outputFile = detectOutputFile(workflow.command);
    appendLog({ timestamp, prompt, workflow: workflow.command, status: 'ok' });
    return { status: 'ok', workflow: workflow.command, orgAlias: sfOrg, output: stdout.trim(), outputFile, timestamp };
  } catch (err) {
    appendLog({ timestamp, prompt, workflow: workflow.command, status: 'error', error: err.message });
    return {
      status: 'error',
      workflow: workflow.command,
      orgAlias: sfOrg,
      output: (err.stderr || err.message || '').trim(),
      outputFile: null,
      timestamp,
    };
  }
}

module.exports = { executePrompt };
