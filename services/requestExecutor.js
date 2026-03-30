const Anthropic = require('@anthropic-ai/sdk');
const modelRouter = require('./modelRouter');
const rateLimiter = require('./rateLimiter');
const tokenBudget = require('./tokenBudget');
const providerHealth = require('./providerHealth');
const modelControlLogger = require('./modelControlLogger');

let _anthropicClient = null;
function getAnthropicClient() {
  if (!_anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _anthropicClient = new Anthropic({ apiKey });
  }
  return _anthropicClient;
}

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

function buildMessages(payload) {
  if (Array.isArray(payload.messages) && payload.messages.length > 0) {
    return payload.messages;
  }
  const text = payload.prompt || payload.input || '';
  return [{ role: 'user', content: text }];
}

async function callAnthropicProvider(payload, candidate) {
  const client = getAnthropicClient();
  const model = candidate.model || 'claude-sonnet-4-6';
  const messages = buildMessages(payload);

  const result = await client.messages.create({
    model,
    max_tokens: payload.max_tokens || 1024,
    ...(payload.system ? { system: payload.system } : {}),
    messages,
  });

  return {
    text: result.content?.[0]?.text ?? '',
    usage: {
      input_tokens: result.usage?.input_tokens ?? 0,
      output_tokens: result.usage?.output_tokens ?? 0,
    },
    model: result.model,
    provider: 'anthropic',
  };
}

async function callProvider(payload, candidate) {
  // Simulation flags preserved for test harness use
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

  if (candidate.provider === 'anthropic') {
    return callAnthropicProvider(payload, candidate);
  }

  throw new Error(`Unsupported provider: ${candidate.provider}`);
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
        const response = await callProvider(payload, candidate);
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
