const state = {
  project: 'global',
  projects: [],
  timeline: [],
};

async function fetchJSON(pathname) {
  const res = await fetch(pathname);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function setActiveProject(project) {
  state.project = project;
  document.getElementById('active-project-label').textContent = `Project: ${project}`;
  loadAll();
}

function renderProjects(projects) {
  const list = document.getElementById('project-list');
  list.innerHTML = '';
  projects.forEach((project) => {
    const li = document.createElement('li');
    li.textContent = project.name;
    if (project.name === state.project) {
      li.classList.add('active');
    }
    li.addEventListener('click', () => {
      setActiveProject(project.name);
    });
    list.appendChild(li);
  });
}

function renderMemorySection(id, entries) {
  const container = document.getElementById(id);
  container.innerHTML = '';
  entries.slice(0, 8).forEach((entry) => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${new Date(entry.timestamp).toLocaleTimeString()}:</strong> ${entry.content}`;
    container.appendChild(item);
  });
}

function renderAgents(agents) {
  const container = document.getElementById('agent-status');
  container.innerHTML = '';
  agents.forEach((agent) => {
    const card = document.createElement('div');
    card.className = `agent-card ${agent.status === 'error' ? 'error' : ''}`;
    card.innerHTML = `
      <div><strong>${agent.agent}</strong> · ${agent.project}</div>
      <div>${agent.lastStage}</div>
      <small>${new Date(agent.timestamp).toLocaleString()}</small>
      <div class="muted">${agent.title}</div>
    `;
    container.appendChild(card);
  });
}

function renderTimeline(entries, query = '') {
  const container = document.getElementById('timeline');
  container.innerHTML = '';
  const lower = query.toLowerCase();
  const filtered = entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(lower) ||
      entry.what.toLowerCase().includes(lower) ||
      (entry.stage && entry.stage.toLowerCase().includes(lower)),
  );

  filtered.forEach((entry) => {
    const item = document.createElement('article');
    item.className = `timeline-item ${entry.type === 'error' || entry.source === 'memory' ? 'highlight' : ''}`;

    const header = document.createElement('header');
    header.innerHTML = `
      <span>${new Date(entry.timestamp).toLocaleString()}</span>
      <span>${entry.agent || ''}</span>
    `;

    const title = document.createElement('h4');
    title.textContent = `${entry.title}`;

    const details = document.createElement('div');
    details.className = 'timeline-details collapsed';
    details.textContent = entry.what || '—';
    details.addEventListener('click', () => {
      details.classList.toggle('collapsed');
    });

    item.appendChild(header);
    item.appendChild(title);
    item.appendChild(details);
    container.appendChild(item);
  });
}

async function loadProjects() {
  const data = await fetchJSON('/projects');
  state.projects = data.projects;
  if (!state.projects.find((p) => p.name === state.project)) {
    const preferred = state.projects.find((p) => p.name === 'system-validation') || state.projects[0];
    if (preferred) {
      state.project = preferred.name;
    }
  }
  renderProjects(state.projects);
}

async function loadMemory() {
  const [longTerm, journal] = await Promise.all([
    fetchJSON(`/memory?project=${state.project}&type=long-term&limit=20`).catch(() => ({ entries: [] })),
    fetchJSON(`/memory?project=${state.project}&type=journal&limit=20`).catch(() => ({ entries: [] })),
  ]);
  renderMemorySection('long-term-list', longTerm.entries || []);
  renderMemorySection('journal-list', journal.entries || []);
}

async function loadAgents() {
  const data = await fetchJSON('/agents/status');
  renderAgents(data.agents || []);
}

async function loadTimeline() {
  const data = await fetchJSON(`/timeline?project=${state.project}`);
  state.timeline = data.events || [];
  renderTimeline(state.timeline, document.getElementById('timeline-search').value);
}

async function loadAll() {
  await Promise.all([loadMemory(), loadAgents(), loadTimeline()]);
}

function registerEvents() {
  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadAll();
  });

  document.getElementById('timeline-search').addEventListener('input', (event) => {
    renderTimeline(state.timeline, event.target.value);
  });
}

async function init() {
  registerEvents();
  await loadProjects();
  document.getElementById('active-project-label').textContent = `Project: ${state.project}`;
  await loadAll();
}

init();
