import React, { useEffect, useState } from 'react';
import { getAIInsights } from '../services/api';

const typeStyle = {
  alert:   { color: '#ff4d4d' },
  warning: { color: '#ffa500' },
  info:    { color: '#4fc3f7' },
};

const AIInsights = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAIInsights()
      .then(setData)
      .catch(() => setError('Failed to load AI insights'));
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>Loading AI insights…</p>;

  return (
    <div style={{ padding: '16px', background: '#16213e', borderRadius: '8px', color: '#e0e0e0' }}>
      <h2>AI Insights</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {data.insights.map((insight, idx) => (
          <li key={idx} style={{ marginBottom: '8px', ...typeStyle[insight.type] }}>
            [{insight.type.toUpperCase()}] {insight.message}
          </li>
        ))}
      </ul>
      <small>Generated at: {new Date(data.generatedAt).toLocaleString()}</small>
    </div>
  );
};

export default AIInsights;
