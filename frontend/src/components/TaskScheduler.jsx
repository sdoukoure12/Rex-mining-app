import React, { useState } from 'react';
import { scheduleTask } from '../services/api';

const TaskScheduler = () => {
  const [task, setTask] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    scheduleTask(task, scheduledAt || undefined)
      .then((res) => {
        setMessage(`Task "${res.task}" scheduled for ${new Date(res.scheduledAt).toLocaleString()}`);
        setTask('');
        setScheduledAt('');
      })
      .catch(() => setError('Failed to schedule task'));
  };

  return (
    <div style={{ padding: '16px', background: '#16213e', borderRadius: '8px', color: '#e0e0e0' }}>
      <h2>Task Scheduler</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Task name"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#0f3460', color: '#e0e0e0' }}
        />
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#0f3460', color: '#e0e0e0' }}
        />
        <button
          type="submit"
          style={{ padding: '8px 16px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Schedule Task
        </button>
      </form>
      {message && <p style={{ color: '#4fc3f7', marginTop: '10px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default TaskScheduler;
