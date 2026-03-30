'use strict';

const path = require('path');

const SCRIPTS = path.join(__dirname, '../projects/system-validation/initiatives/core-model-control/scripts');

function resolveWorkflow(prompt) {
  const lower = prompt.trim().toLowerCase();

  if (lower.includes('contact') && lower.includes('validation')) {
    return {
      type: 'script',
      command: `node ${path.join(SCRIPTS, 'contactOrgValidation.js')}`,
    };
  }

  if (lower.includes('account') && (lower.includes('gap') || lower.includes('analysis'))) {
    return {
      type: 'script',
      command: `node ${path.join(SCRIPTS, 'salesforceOrgValidation.js')}`,
    };
  }

  if (lower.includes('salesforce') && lower.includes('validation')) {
    return {
      type: 'script',
      command: `node ${path.join(SCRIPTS, 'salesforceOrgValidation.js')}`,
    };
  }

  return null;
}

module.exports = { resolveWorkflow };
