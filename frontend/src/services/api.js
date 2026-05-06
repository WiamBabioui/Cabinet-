import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Ajouter le token JWT automatiquement à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cabinet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
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