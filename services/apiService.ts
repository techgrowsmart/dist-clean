import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '../config';
import { getAuthData } from '../utils/authStorage';

// Check if user is a test user
const isTestUser = (email?: string) => {
  return email && (email === 'student1@example.com' || email === 'teacher56@example.com');
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token and CORS headers for web
apiClient.interceptors.request.use(async (config) => {
  try {
    const auth = await getAuthData();
    
    // Check if this is a test user with a fake token
    const isTestUserToken = auth?.token && (
      auth.token.includes('test-token') || 
      auth.token.includes('test-bypass')
    );
    
    // For test users, add special headers but still use Authorization for real database
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
      if (isTestUserToken) {
        // Add test user identifier for backend to handle appropriately
        config.headers['X-Test-User'] = auth.email;
        console.log('🔧 Test user accessing real database:', auth.email);
      }
    }
    
    // Add CORS headers for web platform - Allow all origins
    if (Platform.OS === 'web') {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
      // Remove these headers as they cause CORS issues
      // config.headers['Access-Control-Allow-Origin'] = '*';
      // config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      // config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }
  } catch (error) {
    console.error('Error in request interceptor:', error);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enhanced CORS error logging for web
    if (Platform.OS === 'web' && error.message?.includes('CORS')) {
      console.error('🔥 CORS Error Detected:', {
        message: error.message,
        origin: window.location.origin,
        target: BASE_URL,
        suggestion: 'Backend CORS configuration needs to allow this origin'
      });
    }
    
    // Log network errors
    if (error.code === 'NETWORK_ERROR') {
      console.error('🌐 Network Error:', {
        message: error.message,
        platform: Platform.OS,
        baseURL: BASE_URL,
        isWeb: Platform.OS === 'web'
      });
    }
    
    return Promise.reject(error);
  }
);

// Helper function to make API calls with proper error handling
export const makeApiCall = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any) => {
  try {
    const config = {
      method,
      url,
      ...(data && { data }),
    };
    
    const response = await apiClient.request(config);
    return response.data;
  } catch (error: any) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      console.error(`API Error ${error.response.status}:`, error.response.data);
      throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - No response:', error.message);
      
      if (Platform.OS === 'web' && error.message?.includes('CORS')) {
        throw new Error('CORS error: Please ensure the CORS proxy server is running on localhost:3001');
      }
      
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      console.error('API Call Error:', error.message);
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

// Specific API methods
export const api = {
  get: (url: string) => makeApiCall('GET', url),
  post: (url: string, data?: any) => makeApiCall('POST', url, data),
  put: (url: string, data?: any) => makeApiCall('PUT', url, data),
  delete: (url: string) => makeApiCall('DELETE', url),
};

export default apiClient;
