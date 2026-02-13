import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload content
export const uploadContent = async (formData) => {
  const response = await api.post('/content/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get content by short ID
export const getContent = async (shortId, password = null) => {
  const params = password ? { password } : {};
  const response = await api.get(`/content/${shortId}`, { params });
  return response.data;
};

// Get content metadata
export const getContentMetadata = async (shortId) => {
  const response = await api.get(`/content/${shortId}/metadata`);
  return response.data;
};

// Delete content
export const deleteContent = async (shortId) => {
  const response = await api.delete(`/content/${shortId}`);
  return response.data;
};

export default api;
