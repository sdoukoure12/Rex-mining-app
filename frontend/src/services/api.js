import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
});

const handleError = (err) => {
  const message = err.response?.data?.error || err.message || 'Unknown API error';
  return Promise.reject(new Error(message));
};

export const getMiningStats = () => api.get('/mining/stats').then((res) => res.data).catch(handleError);
export const getWorkers = () => api.get('/mining/workers').then((res) => res.data).catch(handleError);
export const getAIInsights = () => api.get('/ai/insights').then((res) => res.data).catch(handleError);
export const scheduleTask = (task, scheduledAt) =>
  api.post('/mining/schedule', { task, scheduledAt }).then((res) => res.data).catch(handleError);

export default api;
