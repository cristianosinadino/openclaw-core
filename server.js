const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const url = require('url');

const memoryService = require('./services/memoryService');
const timelineService = require('./services/timelineService');
const agentLogger = require('./services/agentLogger');
const { executePrompt } = require('./services/promptExecutor');

const PORT = process.env.PORT || 4141;
const PROJECTS_DIR = path.join(__dirname, 'projects');
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJSON(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text, contentType = 'text/plain') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(text);
}

async function listProjects() {
  try {
    const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
    const projects = entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const projectName = entry.name;
        const initiativesDir = path.join(PROJECTS_DIR, projectName, 'initiatives');
        let initiatives = [];
        try {
          initiatives = (await fs.readdir(initiativesDir, { withFileTypes: true }))
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
        } catch (err) {
          initiatives = [];
        }
        return {
          name: projectName,
          initiatives,
        };
      });
    return Promise.all(projects);
  } catch (err) {
    return [];
  }
}

async function getAgentsStatus() {
  const events = await agentLogger.getRecentEvents({ days: 7 });
  const statusMap = new Map();

  events.forEach((event) => {
    const key = event.agent;
    const existing = statusMap.get(key);
    if (!existing || new Date(event.timestamp) > new Date(existing.timestamp)) {
      statusMap.set(key, {
        agent: event.agent,
        project: event.project,
        lastStage: event.stage || event.type,
        status: event.type === 'error' ? 'error' : 'active',
        timestamp: event.timestamp,
        title: event.title,
      });
    }
  });

  return Array.from(statusMap.values()).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
}

async function serveStatic(req, res, pathname) {
  const cleaned = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, cleaned);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, 'Forbidden');
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    }[ext] || 'text/plain';
    sendText(res, 200, data, contentType);
  } catch (err) {
    if (err.code === 'ENOENT') {
      sendText(res, 404, 'Not Found');
    } else {
      sendText(res, 500, 'Server Error');
    }
  }
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  if (req.method === 'GET' && pathname === '/memory') {
    const project = query.project || 'global';
    const type = query.type;
    const limit = Number.parseInt(query.limit || '100', 10);
    try {
      const entries = await memoryService.queryMemory({ project, type, limit });
      sendJSON(res, 200, { project, count: entries.length, entries });
    } catch (err) {
      sendJSON(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/timeline') {
    const project = query.project || 'global';
    try {
      const events = await timelineService.buildTimeline(project);
      sendJSON(res, 200, { project, events, grouped: timelineService.groupByDate(events) });
    } catch (err) {
      sendJSON(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/projects') {
    const projects = await listProjects();
    sendJSON(res, 200, { projects });
    return;
  }

  if (req.method === 'GET' && pathname === '/agents/status') {
    const statuses = await getAgentsStatus();
    sendJSON(res, 200, { agents: statuses });
    return;
  }

  if (req.method === 'GET' && pathname === '/healthz') {
    sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'POST' && pathname === '/prompt') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      let prompt;
      try {
        ({ prompt } = JSON.parse(body));
      } catch {
        sendJSON(res, 400, { error: 'Invalid JSON body' });
        return;
      }
      if (!prompt || typeof prompt !== 'string') {
        sendJSON(res, 400, { error: 'Missing prompt string' });
        return;
      }

      const result = await executePrompt({ prompt });
      sendJSON(res, result.status === 'error' ? 500 : 200, result);
    });
    return;
  }

  await serveStatic(req, res, pathname);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    sendJSON(res, 500, { error: err.message });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mission Control dashboard server listening on http://localhost:${PORT}`);
});
