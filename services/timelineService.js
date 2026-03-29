const memoryService = require('./memoryService');
const agentLogger = require('./agentLogger');

const IMPORTANT_MEMORY_TYPES = new Set(['decision', 'insight', 'error']);

function buildTimelineItem(source, record) {
  return {
    source,
    timestamp: record.timestamp,
    title: record.title,
    what: record.details || record.content || '',
    agent: record.agent,
    project: record.project,
    stage: record.stage || null,
    type: record.type,
    metadata: record.metadata || {},
  };
}

function dedupeAndSort(items) {
  const seen = new Set();
  const result = [];
  const sorted = items
    .filter((item) => item && item.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (const item of sorted) {
    const key = `${item.timestamp}|${item.title}|${item.what}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function buildTimeline(project = 'global') {
  const events = [];
  const agentEvents = await agentLogger.getRecentEvents({ project });
  agentEvents.forEach((event) => {
    events.push(
      buildTimelineItem('agent-log', {
        ...event,
        what:
          event.details ||
          event.outputSummary ||
          (event.validation ? JSON.stringify(event.validation) : ''),
      }),
    );
  });

  const memoryEntries = await memoryService.queryMemory({ project, limit: 200 });
  memoryEntries
    .filter((entry) => IMPORTANT_MEMORY_TYPES.has(entry.type))
    .forEach((entry) => {
      events.push(
        buildTimelineItem('memory', {
          ...entry,
          title: `${entry.type.toUpperCase()} — ${entry.agent}`,
          details: entry.content,
        }),
      );
    });

  return dedupeAndSort(events);
}

function groupByDate(events) {
  return events.reduce((acc, event) => {
    const date = event.timestamp.slice(0, 10);
    acc[date] = acc[date] || [];
    acc[date].push(event);
    return acc;
  }, {});
}

module.exports = {
  buildTimeline,
  groupByDate,
};
