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

  // Get prediction with sensor data
  predictWithData: (sensorData) => api.post('/predict', sensorData),

  // Save action
  saveAction: (actionData) => api.post('/actions', actionData),

  // Weather API - WeatherAPI.com
  getWeatherData: async (location = 'mumbai') => {
    try {
      // Use backend proxy to avoid CORS
      const response = await api.get('/external/weather', {
        params: { location }
      });
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error);
      // Fallback to direct API if proxy fails
      try {
        const response = await fetch(
          `http://api.weatherapi.com/v1/current.json?key=079a0828828c4c57af2133300262401&q=${location}&aqi=no`
        );
        return await response.json();
      } catch (fallbackError) {
        console.error('Weather API fallback error:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Soil API - AgroMonitoring
  getSoilData: async (lat = 18.975, lon = 72.826) => {
    try {
      // Use backend proxy to avoid CORS
      const response = await api.get('/external/soil', {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('Soil API error:', error);
      // Fallback to direct API if proxy fails
      try {
        const response = await fetch(
          `http://api.agromonitoring.com/agro/1.0/soil?lat=${lat}&lon=${lon}&appid=97f32bc1c704c19fbb76c734b0c127b6`
        );
        return await response.json();
      } catch (fallbackError) {
        console.error('Soil API fallback error:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // NPK API - Agriculture NPK Data
  getNPKData: async () => {
    try {
      // Use backend proxy to avoid CORS
      const response = await api.get('/external/npk');
      return response.data.data; // Return the data object directly
    } catch (error) {
      console.error('NPK API error:', error);
      // Fallback to direct API if proxy fails
      try {
        const response = await fetch(
          `https://npk-agriculture-api.onrender.com/api/npk/latest`
        );
        const result = await response.json();
        return result.data;
      } catch (fallbackError) {
        console.error('NPK API fallback error:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Get all external sensor data in one call
  getAllExternalData: async (location = 'mumbai', lat = 18.975, lon = 72.826) => {
    try {
      const response = await api.get('/external/all', {
        params: { location, lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('All external data error:', error);
      throw error;
    }
  },

  // Irrigation & Fertilizer Prediction
  predictIrrigationFertilizer: (data) => api.post('/predict-irrigation-fertilizer', data),

  // Authentication APIs
  register: (userData) => api.post('/auth/register', userData),
  
  login: (credentials) => api.post('/auth/login', credentials),
  
  getUserProfile: (username) => api.get(`/auth/user/${username}`),
  
  updateSoilType: (username, soilType) => 
    api.put('/auth/update-soil-type', { username, soil_type: soilType }),
};

export default api;
