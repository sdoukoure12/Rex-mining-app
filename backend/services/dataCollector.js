const fs = require('fs');
const path = require('path');

const LOG_FILE = process.env.LOG_FILE
  ? path.resolve(process.cwd(), process.env.LOG_FILE)
  : path.resolve(__dirname, '../../data/miners.log');

const parseLogs = () => {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
  return lines.map((line) => {
    const timestampMatch = line.match(/\[(.+?)\]/);
    const levelMatch = line.match(/\]\s+(INFO|WARN|ERROR)\s+/);
    const workerMatch = line.match(/worker-\d+/);
    return {
      timestamp: timestampMatch ? timestampMatch[1] : '',
      level: levelMatch ? levelMatch[1] : 'INFO',
      worker: workerMatch ? workerMatch[0] : 'system',
      message: line,
    };
  });
};

const getMiningStats = () => {
  const workers = getWorkers();
  const totalHashrate = workers.reduce((sum, w) => sum + w.hashrate, 0);

  return {
    totalHashrate: parseFloat(totalHashrate.toFixed(2)),
    unit: 'TH/s',
    activeWorkers: workers.filter((w) => w.status === 'active').length,
    totalWorkers: workers.length,
    lastUpdated: new Date().toISOString(),
  };
};

const getWorkers = () => {
  const logs = parseLogs();
  const workerMap = {};

  logs.forEach((entry) => {
    if (!entry.worker || entry.worker === 'system') return;
    if (!workerMap[entry.worker]) {
      workerMap[entry.worker] = { name: entry.worker, status: 'unknown', hashrate: 0, pool: '' };
    }
    const hashrateMatch = entry.message.match(/hashrate=([\d.]+)/);
    if (hashrateMatch) workerMap[entry.worker].hashrate = parseFloat(hashrateMatch[1]);
    const poolMatch = entry.message.match(/pool=(\S+)/);
    if (poolMatch) workerMap[entry.worker].pool = poolMatch[1];
    const statusMatch = entry.message.match(/status=(\S+)/);
    if (statusMatch) workerMap[entry.worker].status = statusMatch[1];
    if (entry.level === 'ERROR' && entry.message.includes('connection_lost')) {
      workerMap[entry.worker].status = 'error';
    }
  });

  return Object.values(workerMap);
};

module.exports = { getMiningStats, getWorkers, parseLogs };
