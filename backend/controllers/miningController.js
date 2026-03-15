const dataCollector = require('../services/dataCollector');

const getStats = (req, res) => {
  try {
    const stats = dataCollector.getMiningStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mining stats' });
  }
};

const getWorkers = (req, res) => {
  try {
    const workers = dataCollector.getWorkers();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
};

const scheduleTask = (req, res) => {
  try {
    const { task, scheduledAt } = req.body;
    if (!task) {
      return res.status(400).json({ error: 'Task name is required' });
    }
    res.json({ message: 'Task scheduled', task, scheduledAt: scheduledAt || new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule task' });
  }
};

module.exports = { getStats, getWorkers, scheduleTask };
