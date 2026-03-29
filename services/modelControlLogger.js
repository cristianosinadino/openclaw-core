const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs', 'model-control');

async function ensureDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

function isoDate(ts = new Date()) {
  return ts.toISOString().slice(0, 10);
}

async function log(event = {}) {
  await ensureDir();
  const timestamp = event.timestamp || new Date().toISOString();
  const entry = { ...event, timestamp };
  const filePath = path.join(LOG_DIR, `${isoDate(new Date(timestamp))}.jsonl`);
  await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

module.exports = {
  log,
};
