const aiMonitor = require('../services/aiMonitor');

const getInsights = (req, res) => {
  try {
    const insights = aiMonitor.analyzePerformance();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
};

module.exports = { getInsights };
