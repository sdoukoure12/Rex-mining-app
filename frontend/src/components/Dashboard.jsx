import React, { useEffect, useState } from 'react';
import MiningStats from './MiningStats';
import AIInsights from './AIInsights';
import TaskScheduler from './TaskScheduler';
import SimpleTable from './SimpleTable';
import { getWorkers } from '../services/api';

const workerColumns = [
  { key: 'name',     label: 'Worker'   },
  { key: 'hashrate', label: 'Hashrate (TH/s)' },
  { key: 'pool',     label: 'Pool'     },
  { key: 'status',   label: 'Status'   },
];

const Dashboard = () => {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    getWorkers()
      .then(setWorkers)
      .catch(() => setWorkers([]));
  }, []);

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', background: '#0a0a1a', minHeight: '100vh' }}>
      <h1 style={{ color: '#e94560', textAlign: 'center' }}>⛏ Rex Mining Dashboard</h1>
      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <MiningStats />
        <AIInsights />
        <TaskScheduler />
      </div>
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ color: '#e0e0e0' }}>Workers Overview</h2>
        <SimpleTable columns={workerColumns} rows={workers} />
      </div>
    </div>
  );
};

export default Dashboard;
