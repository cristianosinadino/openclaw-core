const fs = require('fs/promises');
const path = require('path');
const modelControlLogger = require('./modelControlLogger');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'budgets.json');
const STATE_PATH = path.join(__dirname, '..', 'data', 'runtime', 'token-usage.json');

let configCache = null;
let stateCache = null;

async function loadConfig() {
  if (configCache) return configCache;
  const raw = await fs.readFile(CONFIG_PATH, 'utf8');
  configCache = JSON.parse(raw);
  return configCache;
}

async function loadState() {
  if (stateCache) {
    const today = new Date().toISOString().slice(0, 10);
    if (stateCache.date !== today) {
      stateCache = { date: today, global: 0, projects: {}, agents: {} };
      await fs.writeFile(STATE_PATH, JSON.stringify(stateCache, null, 2));
    }
    return stateCache;
  }

  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) {
      stateCache = { date: today, global: 0, projects: {}, agents: {} };
    } else {
      stateCache = parsed;
    }
  } catch (err) {
    stateCache = { date: new Date().toISOString().slice(0, 10), global: 0, projects: {}, agents: {} };
  }
  await fs.writeFile(STATE_PATH, JSON.stringify(stateCache, null, 2));
  return stateCache;
}

async function persist(state) {
  stateCache = state;
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

async function reserve({ project, agent, tokens = 0, capability }) {
  const config = await loadConfig();
  const state = await loadState();

  const projectKey = project && config.projects?.[project] ? project : 'default';
  const agentKey = agent && config.agents?.[agent] ? agent : 'default';

  const globalCap = config.global?.dailyTokens ?? Infinity;
  const projectCap = config.projects?.[projectKey]?.dailyTokens ?? Infinity;
  const agentCap = config.agents?.[agentKey]?.maxTokens ?? Infinity;

  const downgradeCapability = config.projects?.[projectKey]?.downgradeCapability || config.capabilities?.defaultDowngrade;

  const projectUsage = state.projects[projectKey] || 0;
  const agentUsage = state.agents[agentKey] || 0;

  if (state.global + tokens > globalCap) {
    await modelControlLogger.log({ event: 'budget_block', scope: 'global', project, agent, tokens });
    return { allowed: false, reason: 'global-budget' };
  }

  if (projectUsage + tokens > projectCap) {
    await modelControlLogger.log({ event: 'budget_project_downgrade', project, requestedTokens: tokens, downgradeCapability });
    return { allowed: false, reason: 'project-budget', downgradeCapability };
  }

  if (agentUsage + tokens > agentCap) {
    await modelControlLogger.log({ event: 'budget_agent_block', agent, project, tokens });
    return { allowed: false, reason: 'agent-budget' };
  }

  state.global += tokens;
  state.projects[projectKey] = projectUsage + tokens;
  state.agents[agentKey] = agentUsage + tokens;
  await persist(state);

  return { allowed: true };
}

module.exports = {
  reserve,
};
