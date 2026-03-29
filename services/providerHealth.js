const modelControlLogger = require('./modelControlLogger');

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;

const state = new Map();

function get(provider) {
  if (!state.has(provider)) {
    state.set(provider, { failures: 0, downUntil: null });
  }
  return state.get(provider);
}

function isHealthy(provider) {
  const info = get(provider);
  if (!info.downUntil) return true;
  if (Date.now() >= info.downUntil) {
    info.downUntil = null;
    info.failures = 0;
    return true;
  }
  return false;
}

async function reportSuccess(provider) {
  const info = get(provider);
  info.failures = 0;
  info.downUntil = null;
  await modelControlLogger.log({ event: 'provider_success', provider });
}

async function reportFailure(provider, error) {
  const info = get(provider);
  info.failures += 1;
  await modelControlLogger.log({ event: 'provider_failure', provider, error: error?.message || error });
  if (info.failures >= FAILURE_THRESHOLD) {
    info.downUntil = Date.now() + COOLDOWN_MS;
    await modelControlLogger.log({ event: 'provider_quarantine', provider, cooldownMs: COOLDOWN_MS });
  }
}

function getStatus(provider) {
  const info = get(provider);
  return {
    healthy: isHealthy(provider),
    failures: info.failures,
    downUntil: info.downUntil,
  };
}

module.exports = {
  isHealthy,
  reportSuccess,
  reportFailure,
  getStatus,
};
