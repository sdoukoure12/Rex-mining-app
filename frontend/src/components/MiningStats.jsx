import React, { useEffect, useState } from 'react';
import { getMiningStats } from '../services/api';

const MiningStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMiningStats()
      .then(setStats)
      .catch(() => setError('Failed to load mining stats'));
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p>Loading mining stats…</p>;

  return (
    <div style={{ padding: '16px', background: '#16213e', borderRadius: '8px', color: '#e0e0e0' }}>
      <h2>Mining Statistics</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>Total Hashrate: <strong>{stats.totalHashrate} {stats.unit}</strong></li>
        <li>Active Workers: <strong>{stats.activeWorkers} / {stats.totalWorkers}</strong></li>
        <li>Last Updated: <strong>{new Date(stats.lastUpdated).toLocaleString()}</strong></li>
      </ul>
    </div>
  );
};

export default MiningStats;
