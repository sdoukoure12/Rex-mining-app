const dataCollector = require('./dataCollector');

const analyzePerformance = () => {
  const workers = dataCollector.getWorkers();
  const logs = dataCollector.parseLogs();

  const warnings = logs.filter((l) => l.level === 'WARN');
  const errors = logs.filter((l) => l.level === 'ERROR');

  const insights = [];

  if (errors.length > 0) {
    insights.push({
      type: 'alert',
      message: `${errors.length} error(s) detected in worker logs. Check connectivity.`,
    });
  }

  if (warnings.length > 0) {
    insights.push({
      type: 'warning',
      message: `${warnings.length} warning(s) found. Consider checking temperatures and fan speeds.`,
    });
  }

  const avgHashrate =
    workers.length > 0
      ? workers.reduce((sum, w) => sum + w.hashrate, 0) / workers.length
      : 0;

  insights.push({
    type: 'info',
    message: `Average hashrate across ${workers.length} worker(s): ${avgHashrate.toFixed(2)} TH/s`,
  });

  const activeCount = workers.filter((w) => w.status === 'active').length;
  if (activeCount < workers.length) {
    insights.push({
      type: 'warning',
      message: `${workers.length - activeCount} worker(s) are not in active state.`,
    });
  } else {
    insights.push({
      type: 'info',
      message: 'All workers are currently active.',
    });
  }

  return { insights, generatedAt: new Date().toISOString() };
};

module.exports = { analyzePerformance };
