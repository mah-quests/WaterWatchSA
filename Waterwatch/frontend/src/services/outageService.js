import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getOutages = (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  return api.get('/api/outages', { params }).then(r => r.data);
};

export const getOutageById = (id) =>
  api.get(`/api/outages/${id}`).then(r => r.data);

export const createOutage = (formData) =>
  api.post('/api/outages', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const updateOutage = (id, updates) =>
  api.put(`/api/outages/${id}`, updates).then(r => r.data);

export const deleteOutage = (id) =>
  api.delete(`/api/outages/${id}`);
