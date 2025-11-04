import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for session cookies
});

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
