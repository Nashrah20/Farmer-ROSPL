const API_URL = import.meta.env.VITE_API_URL || 'https://farmer-hackathon-x9m8.onrender.com';

export default {
  apiUrl: API_URL,
  healthCheckEndpoint: `${API_URL}/api/health`
};
