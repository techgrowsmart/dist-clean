import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '../config';
import { getAuthData } from '../utils/authStorage';

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token and handle CORS
apiClient.interceptors.request.use(async (config) => {
  try {
    const auth = await getAuthData();
    
    if (auth && auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    
    // Add platform-specific headers
    if (Platform.OS === 'web') {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    
    return config;
  } catch (error) {
    console.error('Request interceptor error:', error);
    return config;
  }
});

// Response interceptor with enhanced error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Enhanced CORS error handling
    if (error.message?.includes('CORS') || error.response?.status === 0) {
      console.error('CORS Error Detected:', {
        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        target: BASE_URL
      });
      
      if (Platform.OS === 'web') {
        throw new Error('CORS error: Backend configuration updated to allow portal.gogrowsmart.com');
      }
    }
    
    throw new Error(error.message || 'Network error: Unable to connect to server.');
  }
);

export const addFavoriteTeacher = async (teacherEmail: string) => {
  try {
    console.log('⭐ Adding favorite teacher:', teacherEmail);
    
    const authData = await getAuthData();
    if (!authData?.token) {
      throw new Error('Authentication required');
    }

    const response = await apiClient.post('/favorites/add', {
      email: teacherEmail
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Add favorite error:', error);
    throw error;
  }
};

export const removeFavoriteTeacher = async (teacherEmail: string) => {
  try {
    console.log('🗑️ Removing favorite teacher:', teacherEmail);
    
    const authData = await getAuthData();
    if (!authData?.token) {
      throw new Error('Authentication required');
    }

    const response = await apiClient.delete('/favorites/remove', {
      data: { email: teacherEmail }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Remove favorite error:', error);
    throw error;
  }
};

export const getFavoriteTeachers = async () => {
  try {
    console.log('📋 Getting favorite teachers');
    
    const authData = await getAuthData();
    if (!authData?.token) {
      return [];
    }

    const response = await apiClient.get('/favorites/list');
    return response.data;
  } catch (error: any) {
    console.error('❌ Get favorites error:', error);
    return [];
  }
};

export const checkFavoriteTeacher = async (teacherEmail: string) => {
  try {
    console.log('🔍 Checking favorite teacher:', teacherEmail);
    
    const authData = await getAuthData();
    if (!authData?.token) {
      return false;
    }

    const response = await apiClient.get(`/favorites/check/${teacherEmail}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Check favorite error:', error);
    return false;
  }
};

// Export apiClient as api for general API usage
export const api = {
  get: async (url: string, config?: any) => {
    const response = await apiClient.get(url, config);
    return { success: true, data: response.data, status: response.status };
  },
  post: async (url: string, data?: any, config?: any) => {
    const response = await apiClient.post(url, data, config);
    return { success: true, data: response.data, status: response.status };
  },
  put: async (url: string, data?: any, config?: any) => {
    const response = await apiClient.put(url, data, config);
    return { success: true, data: response.data, status: response.status };
  },
  delete: async (url: string, config?: any) => {
    const response = await apiClient.delete(url, config);
    return { success: true, data: response.data, status: response.status };
  },
};
