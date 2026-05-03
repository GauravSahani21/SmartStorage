import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005/api',
  timeout: 60000, // bumped for AI calls
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('studentvault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('studentvault_token');
      localStorage.removeItem('studentvault_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Documents
export const documentsAPI = {
  upload: (formData, onProgress) =>
    API.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(percent);
        }
      },
    }),
  getAll:       (params) => API.get('/documents', { params }),
  getOne:       (id) => API.get(`/documents/${id}`),
  getFile:      (id) => `${BASE}/documents/${id}/file`,
  update:       (id, data) => API.put(`/documents/${id}`, data),
  delete:       (id) => API.delete(`/documents/${id}`),
  share:        (id, data) => API.post(`/documents/${id}/share`, data),
  revokeShare:  (id) => API.delete(`/documents/${id}/share`),
  getStats:     () => API.get('/documents/stats'),
  getShared:    (token) => API.get(`/documents/shared/${token}`),
  getSharedFile:(token) => `${BASE}/documents/shared/${token}/file`,
  // New features
  summarize:    (id) => API.post(`/documents/${id}/summarize`),
  getTimeline:  () => API.get('/documents/timeline'),
  getExpiring:  (days = 30) => API.get('/documents/expiring', { params: { days } }),
  getViewLogs:  (id) => API.get(`/documents/${id}/views`),
  verify:       (token) => API.get(`/documents/verify/${token}`),
};

// Rooms
export const roomsAPI = {
  getAll:         () => API.get('/rooms'),
  create:         (data) => API.post('/rooms', data),
  getOne:         (id) => API.get(`/rooms/${id}`),
  join:           (code) => API.post(`/rooms/join/${code}`),
  addDocument:    (id, documentId) => API.post(`/rooms/${id}/documents`, { documentId }),
  delete:         (id) => API.delete(`/rooms/${id}`),
};

export default API;
