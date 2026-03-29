const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const memoryService = require('./memoryService');

const LOG_DIR = path.join(__dirname, '..', 'logs', 'agents');
const MAX_LOG_DAYS = parseInt(process.env.MAX_LOG_DAYS || '30', 10);

async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

function isoDate(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function buildRecord(base = {}) {
  const timestamp = base.timestamp || new Date().toISOString();
  return {
    id: base.id || crypto.randomUUID(),
    timestamp,
    agent: base.agent || 'unknown',
    project: base.project || 'global',
    type: base.type || 'event',
    stage: base.stage || null,
    title: base.title || `${base.stage || base.type || 'event'} — ${base.agent || 'agent'}`,
    details: base.details || base.what || '',
    input: base.input ?? null,
    outputSummary: base.outputSummary ?? null,
    validation: base.validation ?? null,
    metadata: typeof base.metadata === 'object' && base.metadata !== null ? base.metadata : {},
  };
}

async function appendLog(record) {
  await ensureLogDir();
  const filePath = path.join(LOG_DIR, `${isoDate(record.timestamp)}.jsonl`);
  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

async function mirrorToMemory(record, type) {
  try {
    await memoryService.writeMemory({
      timestamp: record.timestamp,
      agent: record.agent,
      project: record.project,
      type,
      content: record.details || record.title,
      metadata: {
        source: 'agentLogger',
        stage: record.stage,
        id: record.id,
      },
    });
  } catch (err) {
    // memory writes are best-effort; swallow errors to avoid blocking logging
  }
}

async function logEvent(payload) {
  const record = buildRecord({ ...payload, type: 'event' });
  await appendLog(record);
  if (payload?.mirrorToMemory) {
    await mirrorToMemory(record, payload.memoryType || 'journal');
  }
  return record;
}

async function logDecision(payload) {
  const record = buildRecord({ ...payload, type: 'decision' });
  await appendLog(record);
  await mirrorToMemory(record, 'decision');
  return record;
}

async function logError(payload) {
  const record = buildRecord({ ...payload, type: 'error' });
  await appendLog(record);
  await mirrorToMemory(record, 'error');
  return record;
}

async function readLogFile(filePath) {
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

async function listLogFiles() {
  try {
    const entries = await fs.readdir(LOG_DIR);
    return entries
      .filter((file) => file.endsWith('.jsonl'))
      .sort()
      .slice(-MAX_LOG_DAYS)
      .map((file) => path.join(LOG_DIR, file));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function getRecentEvents({ project, days } = {}) {
  const files = await listLogFiles();
  const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
  const events = [];

  for (const file of files) {
    const rows = await readLogFile(file);
    for (const row of rows) {
      if (project && row.project !== project) continue;
      const ts = new Date(row.timestamp).getTime();
      if (cutoff && ts < cutoff) continue;
      events.push(row);
    }
  }
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

module.exports = {
  logEvent,
  logDecision,
  logError,
  getRecentEvents,
};
