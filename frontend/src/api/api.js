import axios from 'axios';
import config from '../config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const farmAPI = {
  // Health check
  health: () => api.get('/health'),

  // Get zones
  getZones: () => api.get('/zones'),

  // Get latest data for a zone
  getLatest: (zoneId) => api.get('/latest', { params: { zone_id: zoneId } }),

  // Get historical data
  getHistory: (zoneId, fromDate, toDate, limit = 500) =>
    api.get('/history', {
      params: {
        zone_id: zoneId,
        from: fromDate,
        to: toDate,
        limit,
      },
    }),

  // Train model
  trainModel: () => api.post('/train'),

  // Get prediction
  predict: (zoneId) => api.post('/predict', { zone_id: zoneId }),

  // Save action
  saveAction: (actionData) => api.post('/actions', actionData),
};

export default api;
