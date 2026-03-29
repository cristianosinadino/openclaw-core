const modelRouter = require('./modelRouter');
const rateLimiter = require('./rateLimiter');
const tokenBudget = require('./tokenBudget');
const providerHealth = require('./providerHealth');
const modelControlLogger = require('./modelControlLogger');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calcBackoff(attempt, policy) {
  const base = policy.backoffBaseMs || 100;
  const max = policy.backoffMaxMs || 1000;
  const jitter = policy.jitterMs || 50;
  const delay = Math.min(base * 2 ** (attempt - 1), max) + Math.floor(Math.random() * jitter);
  return delay;
}

async function simulateModelCall(payload, candidate) {
  if (payload.simulateFailures?.includes(candidate.model)) {
    const error = new Error('Simulated provider failure');
    error.nonRetryable = true;
    throw error;
  }
  if (payload.simulateTimeout?.includes(candidate.model)) {
    const error = new Error('Simulated timeout');
    error.retryable = true;
    throw error;
  }

  if (payload.operation === 'summarize') {
    const sentence = (payload.input || '').trim().replace(/\s+/g, ' ');
    const truncated = sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
    return {
      text: truncated || 'Empty input',
      model: candidate.model,
    };
  }

  return {
    echo: payload,
    model: candidate.model,
  };
}

async function execute({ capability, agent, project = 'global', payload = {}, estimatedTokens = 0, visited = new Set() }) {
  const routing = await modelRouter.buildCandidates({ capability, agent, project });
  const policy = routing.fallbackPolicy;
  visited.add(routing.capability);

  for (const candidate of routing.candidates) {
    if (!providerHealth.isHealthy(candidate.provider)) {
      await modelControlLogger.log({
        event: 'provider_skipped',
        provider: candidate.provider,
        model: candidate.model,
        reason: 'unhealthy',
        capability: routing.capability,
        agent,
        project,
      });
      continue;
    }

    for (let attempt = 1; attempt <= (policy.maxRetries || 1); attempt += 1) {
      const rate = await rateLimiter.reserve({
        provider: candidate.provider,
        model: candidate.model,
        project,
        agent,
        tokens: estimatedTokens,
      });
      if (!rate.allowed) {
        await modelControlLogger.log({
          event: 'rate_limiter_retry',
          capability: routing.capability,
          provider: candidate.provider,
          model: candidate.model,
          agent,
          project,
          attempt,
          retryAfterMs: rate.retryAfterMs,
        });
        if (attempt >= (policy.maxRetries || 1)) {
          break;
        }
        await sleep(calcBackoff(attempt, policy));
        continue;
      }

      const budget = await tokenBudget.reserve({ project, agent, tokens: estimatedTokens, capability: routing.capability });
      if (!budget.allowed) {
        if (budget.downgradeCapability && !visited.has(budget.downgradeCapability)) {
          await modelControlLogger.log({
            event: 'budget_downgrade',
            from: routing.capability,
            to: budget.downgradeCapability,
            project,
            agent,
          });
          const downgradedTokens = Math.max(1, Math.floor(estimatedTokens * 0.6));
          return execute({ capability: budget.downgradeCapability, agent, project, payload, estimatedTokens: downgradedTokens, visited });
        }
        await modelControlLogger.log({
          event: 'budget_block',
          capability: routing.capability,
          project,
          agent,
          reason: budget.reason,
        });
        return { status: 'blocked', reason: budget.reason };
      }

      try {
        const response = await simulateModelCall(payload, candidate);
        await providerHealth.reportSuccess(candidate.provider);
        await modelControlLogger.log({
          event: 'request_success',
          capability: routing.capability,
          provider: candidate.provider,
          model: candidate.model,
          agent,
          project,
          attempt,
        });
        return {
          status: 'ok',
          capability: routing.capability,
          provider: candidate.provider,
          model: candidate.model,
          response,
        };
      } catch (err) {
        await providerHealth.reportFailure(candidate.provider, err);
        await modelControlLogger.log({
          event: 'request_failure',
          capability: routing.capability,
          provider: candidate.provider,
          model: candidate.model,
          agent,
          project,
          attempt,
          message: err.message,
        });
        const shouldRetry = !err.nonRetryable && attempt < (policy.maxRetries || 1);
        if (!shouldRetry) {
          break;
        }
        await sleep(calcBackoff(attempt, policy));
      }
    }
  }

  throw new Error(`No available providers for capability ${routing.capability}`);
}

module.exports = {
  execute,
};
