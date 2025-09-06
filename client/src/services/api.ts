import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Update with your actual API URL

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // Navigate to login (you'll need to implement this)
    }
    return Promise.reject(error);
  }
);

// Network status check
export const isNetworkAvailable = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return !!(netInfo.isConnected && netInfo.isInternetReachable);
};

// Offline data storage
export const storeOfflineData = async (endpoint: string, data: any): Promise<void> => {
  try {
    const offlineData = await AsyncStorage.getItem('offlineData') || '[]';
    const parsedData = JSON.parse(offlineData);
    parsedData.push({
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    await AsyncStorage.setItem('offlineData', JSON.stringify(parsedData));
  } catch (error) {
    console.error('Error storing offline data:', error);
  }
};

// Sync offline data
export const syncOfflineData = async (): Promise<void> => {
  try {
    const isOnline = await isNetworkAvailable();
    if (!isOnline) return;

    const offlineData = await AsyncStorage.getItem('offlineData') || '[]';
    const parsedData = JSON.parse(offlineData);
    const unsyncedData = parsedData.filter((item: any) => !item.synced);

    for (const item of unsyncedData) {
      try {
        await api.post(item.endpoint, item.data);
        // Mark as synced
        item.synced = true;
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    // Update storage with synced items
    await AsyncStorage.setItem('offlineData', JSON.stringify(parsedData));
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
};

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Farmer API calls
export const farmerAPI = {
  getDashboard: async () => {
    const response = await api.get('/farmer/dashboard');
    return response.data;
  },

  getFarms: async () => {
    const response = await api.get('/farmer/farms');
    return response.data;
  },

  createFarm: async (farmData: any) => {
    const response = await api.post('/farmer/farms', farmData);
    return response.data;
  },

  getFarm: async (farmId: string) => {
    const response = await api.get(`/farmer/farms/${farmId}`);
    return response.data;
  },

  updateFarm: async (farmId: string, farmData: any) => {
    const response = await api.put(`/farmer/farms/${farmId}`, farmData);
    return response.data;
  },

  deleteFarm: async (farmId: string) => {
    const response = await api.delete(`/farmer/farms/${farmId}`);
    return response.data;
  },

  getFlocks: async (farmId: string) => {
    const response = await api.get(`/farmer/farms/${farmId}/flocks`);
    return response.data;
  },

  createFlock: async (flockData: any) => {
    const response = await api.post('/farmer/flocks', flockData);
    return response.data;
  },

  getFlock: async (flockId: string) => {
    const response = await api.get(`/farmer/flocks/${flockId}`);
    return response.data;
  },

  updateFlock: async (flockId: string, flockData: any) => {
    const response = await api.put(`/farmer/flocks/${flockId}`, flockData);
    return response.data;
  },

  deleteFlock: async (flockId: string) => {
    const response = await api.delete(`/farmer/flocks/${flockId}`);
    return response.data;
  },

  // Task management for farmers
  getTasks: async () => {
    const response = await api.get('/farmer/tasks');
    return response.data;
  },

  createTask: async (taskData: any) => {
    const response = await api.post('/farmer/tasks', taskData);
    return response.data;
  },

  updateTask: async (taskId: string, taskData: any) => {
    const response = await api.put(`/farmer/tasks/${taskId}`, taskData);
    return response.data;
  },

  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/farmer/tasks/${taskId}`);
    return response.data;
  },
};

// Farm Worker API calls
export const workerAPI = {
  getDashboard: async () => {
    const response = await api.get('/worker/dashboard');
    return response.data;
  },

  getFlocks: async () => {
    const response = await api.get('/worker/flocks');
    return response.data;
  },

  getTasks: async () => {
    const response = await api.get('/worker/tasks');
    return response.data;
  },

  startTask: async (taskId: string) => {
    const response = await api.post(`/worker/tasks/${taskId}/start`);
    return response.data;
  },

  completeTask: async (taskId: string) => {
    const response = await api.post(`/worker/tasks/${taskId}/complete`);
    return response.data;
  },

  submitFeedRecord: async (data: any) => {
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      await storeOfflineData('/worker/records/feed', data);
      return { success: true, offline: true };
    }

    const response = await api.post('/worker/records/feed', data);
    return response.data;
  },

  submitHealthRecord: async (data: any) => {
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      await storeOfflineData('/worker/records/health', data);
      return { success: true, offline: true };
    }

    const response = await api.post('/worker/records/health', data);
    return response.data;
  },

  submitWeightRecord: async (data: any) => {
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      await storeOfflineData('/worker/records/weight', data);
      return { success: true, offline: true };
    }

    const response = await api.post('/worker/records/weight', data);
    return response.data;
  },

  submitEggRecord: async (data: any) => {
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      await storeOfflineData('/worker/records/eggs', data);
      return { success: true, offline: true };
    }

    const response = await api.post('/worker/records/eggs', data);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/worker/reports');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/worker/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/worker/profile', profileData);
    return response.data;
  },
};

// Veterinarian API calls
export const vetAPI = {
  getDashboard: async () => {
    const response = await api.get('/vet/dashboard');
    return response.data;
  },

  getConsultations: async () => {
    const response = await api.get('/vet/consultations');
    return response.data;
  },

  getConsultation: async (consultationId: string) => {
    const response = await api.get(`/vet/consultations/${consultationId}`);
    return response.data;
  },

  diagnoseConsultation: async (consultationId: string, diagnosis: any) => {
    const response = await api.post(`/vet/consultations/${consultationId}/diagnose`, diagnosis);
    return response.data;
  },

  getHealthAlerts: async () => {
    const response = await api.get('/vet/health-alerts');
    return response.data;
  },

  respondToHealthAlert: async (alertId: string, response: any) => {
    const apiResponse = await api.post(`/vet/health-alerts/${alertId}/respond`, response);
    return apiResponse.data;
  },

  getFlocks: async () => {
    const response = await api.get('/vet/flocks');
    return response.data;
  },

  getFlock: async (flockId: string) => {
    const response = await api.get(`/vet/flocks/${flockId}`);
    return response.data;
  },

  performHealthCheck: async (flockId: string, healthCheckData: any) => {
    const response = await api.post(`/vet/flocks/${flockId}/health-check`, healthCheckData);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/vet/reports');
    return response.data;
  },
};

// Marketplace API calls
export const marketplaceAPI = {
  getProducts: async () => {
    const response = await api.get('/marketplace/products');
    return response.data;
  },

  getProduct: async (productId: string) => {
    const response = await api.get(`/marketplace/products/${productId}`);
    return response.data;
  },

  createProduct: async (data: any) => {
    const response = await api.post('/marketplace/products', data);
    return response.data;
  },

  updateProduct: async (productId: string, data: any) => {
    const response = await api.put(`/marketplace/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/marketplace/products/${productId}`);
    return response.data;
  },

  addProductReview: async (productId: string, review: any) => {
    const response = await api.post(`/marketplace/products/${productId}/reviews`, review);
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await api.post('/marketplace/orders', orderData);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/marketplace/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/marketplace/orders/${orderId}/status`, { status });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/marketplace/categories');
    return response.data;
  },
};

// Common API calls
export const commonAPI = {
  getProfile: async () => {
    const response = await api.get('/common/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/common/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData: any) => {
    const response = await api.post('/common/profile/change-password', passwordData);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/common/notifications');
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.put(`/common/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await api.put('/common/notifications/read-all');
    return response.data;
  },

  getBreeds: async () => {
    const response = await api.get('/common/breeds');
    return response.data;
  },

  getBreed: async (breedId: string) => {
    const response = await api.get(`/common/breeds/${breedId}`);
    return response.data;
  },

  getPublicFarms: async () => {
    const response = await api.get('/common/farms');
    return response.data;
  },

  getPublicFarm: async (farmId: string) => {
    const response = await api.get(`/common/farms/${farmId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/common/stats');
    return response.data;
  },

  submitContact: async (contactData: any) => {
    const response = await api.post('/common/contact', contactData);
    return response.data;
  },

  getHealthCheck: async () => {
    const response = await api.get('/common/health');
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get(`/common/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default api;
