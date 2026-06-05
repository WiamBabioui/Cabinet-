import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const processPhotoUrls = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(processPhotoUrls);
  }
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === 'photo_url' && typeof obj[key] === 'string' && obj[key].startsWith('/uploads')) {
        obj[key] = `${apiBase}${obj[key]}`;
      } else if (typeof obj[key] === 'object') {
        obj[key] = processPhotoUrls(obj[key]);
      }
    }
  }
  return obj;
};

// Ajouter le token JWT automatiquement à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cabinet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs globalement et formater les photo_url
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = processPhotoUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cabinet_token');
      localStorage.removeItem('cabinet_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
