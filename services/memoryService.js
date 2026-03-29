const fs = require('fs/promises');
const path = require('path');

const MEMORY_ROOT = path.join(__dirname, '..', 'memory');
const PROJECTS_ROOT = path.join(MEMORY_ROOT, 'projects');
const GLOBAL_SCOPE = path.join(MEMORY_ROOT, 'global');
const DEFAULT_TYPES = new Set(['journal', 'decision', 'error', 'insight', 'long-term', 'agent-log']);

function normalizeProject(project) {
  if (!project || project === 'global') {
    return { name: 'global', dir: GLOBAL_SCOPE };
  }
  return {
    name: project,
    dir: path.join(PROJECTS_ROOT, project)
  };
}

function normalizeType(type = 'journal') {
  const normalized = String(type).toLowerCase();
  return DEFAULT_TYPES.has(normalized) ? normalized : normalized.replace(/[^a-z0-9-]/g, '') || 'journal';
}

function ensureTimestamp(ts) {
  if (!ts) return new Date().toISOString();
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function dateString(ts) {
  return ensureTimestamp(ts).slice(0, 10);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function appendJsonLine(filePath, payload) {
  const line = `${JSON.stringify(payload)}\n`;
  await fs.appendFile(filePath, line, { encoding: 'utf8' });
}

async function writeMemory(entry = {}) {
  const projectInfo = normalizeProject(entry.project);
  const type = normalizeType(entry.type);
  const timestamp = ensureTimestamp(entry.timestamp);

  const record = {
    timestamp,
    agent: entry.agent || 'unknown',
    project: projectInfo.name,
    type,
    content: (entry.content || '').trim(),
    metadata: typeof entry.metadata === 'object' && entry.metadata !== null ? entry.metadata : {},
  };

  if (!record.content) {
    throw new Error('memoryService.writeMemory: content is required');
  }

  await ensureDir(GLOBAL_SCOPE);
  await ensureDir(PROJECTS_ROOT);

  const typeDir = path.join(projectInfo.dir, type);
  await ensureDir(typeDir);

  const filePath = path.join(typeDir, `${dateString(timestamp)}.jsonl`);
  await appendJsonLine(filePath, record);
  return record;
}

async function readJsonLines(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function listTypeDirs(scopeDir) {
  try {
    const entries = await fs.readdir(scopeDir, { withFileTypes: true });
    return entries.filter((d) => d.isDirectory()).map((d) => path.join(scopeDir, d.name));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function listFiles(dir) {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((file) => file.endsWith('.jsonl')).map((file) => path.join(dir, file));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function queryMemory({ project = 'global', type, limit = 100, since } = {}) {
  const projectInfo = normalizeProject(project);
  const sinceTs = since ? new Date(since).getTime() : null;
  const typeDirs = [];

  if (type) {
    typeDirs.push(path.join(projectInfo.dir, normalizeType(type)));
  } else {
    const dirs = await listTypeDirs(projectInfo.dir);
    typeDirs.push(...dirs);
  }

  const payloads = [];
  for (const dir of typeDirs) {
    const files = (await listFiles(dir)).sort().reverse();
    for (const file of files) {
      const entries = await readJsonLines(file);
      for (const item of entries) {
        payloads.push(item);
      }
      if (payloads.length >= limit) break;
    }
    if (payloads.length >= limit) break;
  }

  let results = payloads;
  if (sinceTs) {
    results = results.filter((item) => {
      const ts = new Date(item.timestamp).getTime();
      return !Number.isNaN(ts) && ts >= sinceTs;
    });
  }

  return results
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

async function summarizeMemory({ project = 'global', windowDays = 7 } = {}) {
  const entries = await queryMemory({ project, limit: 200 });
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recent = entries.filter((entry) => new Date(entry.timestamp).getTime() >= cutoff);

  const countByType = recent.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {});

  return {
    project,
    windowDays,
    totalEntries: recent.length,
    countByType,
    highlights: recent.slice(0, 5),
  };
}

module.exports = {
  writeMemory,
  queryMemory,
  summarizeMemory,
};
