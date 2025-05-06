import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Socket.IO instance
let socket = null;

// API methods
export const apiService = {
  // Auth
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Orders
  getOrders: () => api.get('/orders'),
  getActiveOrders: () => api.get('/orders/active'),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrderStatus: (orderId, status) => 
    api.patch(`/orders/${orderId}/status`, { status }),

  // Analytics
  getDailyStats: () => api.get('/analytics/daily-stats'),
  getHourlyOrders: () => api.get('/analytics/hourly-orders'),
  getPeakHours: () => api.get('/analytics/peak-hours'),

  // Socket.IO
  connectSocket: () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io(API_URL.replace('/api', ''), {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return socket;
  },

  getSocket: () => socket,

  // Helper methods
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
