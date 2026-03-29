const fs = require('fs/promises');
const path = require('path');
const modelControlLogger = require('./modelControlLogger');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'provider-limits.json');
const WINDOW_MS = 60_000;

let configCache = null;
const buckets = new Map();

async function loadConfig() {
  if (configCache) return configCache;
  const raw = await fs.readFile(CONFIG_PATH, 'utf8');
  configCache = JSON.parse(raw);
  return configCache;
}

function bucketKey(scope, id) {
  return `${scope}:${id}`;
}

function getBucket(key) {
  if (!buckets.has(key)) {
    buckets.set(key, []);
  }
  return buckets.get(key);
}

function prune(bucket) {
  const cutoff = Date.now() - WINDOW_MS;
  while (bucket.length && bucket[0].time < cutoff) {
    bucket.shift();
  }
}

function wouldExceed(bucket, limit, tokens = 0) {
  if (!limit) return { allowed: true };
  prune(bucket);
  if (limit.requestsPerMinute && bucket.length >= limit.requestsPerMinute) {
    const retryAfter = Math.max(0, WINDOW_MS - (Date.now() - bucket[0].time));
    return { allowed: false, reason: 'requests', retryAfterMs: retryAfter };
  }
  if (limit.tokensPerMinute) {
    const used = bucket.reduce((sum, entry) => sum + entry.tokens, 0);
    if (used + tokens > limit.tokensPerMinute) {
      const retryAfter = bucket.length
        ? Math.max(0, WINDOW_MS - (Date.now() - bucket[0].time))
        : WINDOW_MS;
      return { allowed: false, reason: 'tokens', retryAfterMs: retryAfter };
    }
  }
  return { allowed: true };
}

function commit(bucket, tokens) {
  bucket.push({ time: Date.now(), tokens });
}

async function reserve({ provider, model, project, agent, tokens = 0 }) {
  const config = await loadConfig();
  const checks = [];

  const providerLimit = config.providers?.[provider];
  const modelLimit = config.models?.[`${provider}/${model}`] || config.models?.[model];
  const projectKey = project && config.projects?.[project] ? project : 'default';
  const projectLimit = config.projects?.[projectKey];
  const agentKey = agent && config.agents?.[agent] ? agent : 'default';
  const agentLimit = config.agents?.[agentKey];

  checks.push({ key: bucketKey('provider', provider), limit: providerLimit });
  checks.push({ key: bucketKey('model', `${provider}/${model}`), limit: modelLimit });
  checks.push({ key: bucketKey('project', projectKey), limit: projectLimit });
  checks.push({ key: bucketKey('agent', agentKey), limit: agentLimit });

  for (const check of checks) {
    if (!check.limit) continue;
    const bucket = getBucket(check.key);
    const verdict = wouldExceed(bucket, check.limit, tokens);
    if (!verdict.allowed) {
      await modelControlLogger.log({
        event: 'throttle',
        scope: check.key,
        reason: verdict.reason,
        retryAfterMs: verdict.retryAfterMs,
        provider,
        model,
        project,
        agent,
      });
      return { allowed: false, retryAfterMs: verdict.retryAfterMs, scope: check.key };
    }
  }

  // All clear, commit usage
  for (const check of checks) {
    if (!check.limit) continue;
    const bucket = getBucket(check.key);
    commit(bucket, tokens);
  }

  return { allowed: true };
}

module.exports = {
  reserve,
};
