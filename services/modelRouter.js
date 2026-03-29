const fs = require('fs/promises');
const path = require('path');
const modelControlLogger = require('./modelControlLogger');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'model-routing.json');

let configCache = null;

async function loadConfig() {
  if (configCache) return configCache;
  const raw = await fs.readFile(CONFIG_PATH, 'utf8');
  configCache = JSON.parse(raw);
  return configCache;
}

async function resolveCapability({ capability, agent }) {
  const config = await loadConfig();
  const effectiveCapability = capability || config.defaults?.[agent] || config.defaults?.default;
  if (!effectiveCapability) {
    throw new Error(`No capability specified for agent ${agent}`);
  }

  const definition = config.capabilities?.[effectiveCapability];
  if (!definition) {
    throw new Error(`Capability ${effectiveCapability} not defined`);
  }

  return {
    capability: effectiveCapability,
    definition,
    fallbackPolicy: config.fallbackPolicy || { maxRetries: 1, backoffBaseMs: 100, backoffMaxMs: 1000, jitterMs: 50 },
  };
}

async function buildCandidates({ capability, agent, project }) {
  const resolved = await resolveCapability({ capability, agent });
  const candidates = resolved.definition.candidates || [];

  await modelControlLogger.log({
    event: 'routing_decision',
    capability: resolved.capability,
    agent,
    project,
    candidates,
  });

  return {
    capability: resolved.capability,
    candidates,
    downgradeTo: resolved.definition.downgradeTo,
    fallbackPolicy: resolved.fallbackPolicy,
  };
}

module.exports = {
  buildCandidates,
};
