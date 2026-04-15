import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '../config';
import { clearAllStorage, getAuthData, storeAuthData } from '../utils/authStorage';

// Check if user is a test user
const isTestUser = (email: string) => {
  const testEmails = ['test31@example.com', 'test@example.com', 'admin@test.com'];
  return testEmails.includes(email);
};

// Create axios instance with default configuration
const apiClient = axios.create({
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
    
    console.log('API Request:', {
      url: config.baseURL + config.url,
      method: config.method,
      hasAuth: !!auth?.token
    });
    
    return config;
  } catch (error) {
    console.error('Request interceptor error:', error);
    return config;
  }
});

// Response interceptor with enhanced error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url
    });
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

export class AuthService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      console.log('API Request:', { endpoint, BASE_URL });
      
      const url = `${BASE_URL}/api${endpoint}`;
      
      // Get auth token for authenticated requests
      const authData = await getAuthData();
      
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(authData?.token && { Authorization: `Bearer ${authData.token}` }),
          ...options.headers
        },
        mode: 'cors',
        credentials: 'omit'
      };
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server error: Received HTML instead of JSON');
      }
      
      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = '';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || '';
        } catch (e) {
          // If can't parse JSON, use status text
          errorMessage = response.statusText || '';
        }

        // Handle different HTTP status codes with backend message
        switch (response.status) {
          case 400:
            throw new Error(errorMessage || 'Bad request: Please check your input data');
          case 401:
            throw new Error(errorMessage || 'Unauthorized: Please login again');
          case 403:
            throw new Error(errorMessage || 'Forbidden: You do not have permission to perform this action');
          case 404:
            throw new Error(errorMessage || 'Not found: The requested resource was not found');
          case 409:
            throw new Error(errorMessage || 'Conflict: This resource already exists');
          case 429:
            throw new Error(errorMessage || 'Too many requests: Please try again later');
          case 500:
            throw new Error(errorMessage || 'Server error: Please try again later');
          default:
            throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
        }
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Service Error:', {
        message: error.message,
        endpoint,
        baseURL: BASE_URL
      });
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Please check your connection and try again');
      }
      
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      
      if (error.message?.includes('CORS')) {
        throw new Error('Connection error: Please try again in a moment');
      }
      
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('Login attempt:', { email });
      
      // Check if test user
      if (isTestUser(email)) {
        console.log('Test user detected, using real database');
      }
      
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.token) {
        await storeAuthData(response);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: any) {
    try {
      console.log('Registration attempt:', userData);
      
      const response = await this.makeRequest('/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success || response.otpId) {
        return { success: true, otpId: response.otpId };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific registration errors
      if (error.message?.includes('Conflict')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      
      throw error;
    }
  }

  async sendOTP(email: string, password?: string, isSignup: boolean = false, name?: string, phone?: string) {
    try {
      console.log('Sending OTP:', { email, isSignup, phone });
      
      const endpoint = isSignup ? '/signup' : '/auth/login';
      const phoneNumber = phone && phone.trim() ? phone : '+0000000000';
      const body = isSignup 
        ? { email, fullName: name, phonenumber: phoneNumber, role: 'student' }
        : { email, password };
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      // Check if it's a test user that bypasses OTP
      if (response.isTestUser && response.token) {
        return {
          success: true,
          isTestUser: true,
          token: response.token,
          user: response.user,
          role: response.role
        };
      }
      
      return {
        success: true,
        otpId: response.otpId,
        message: response.message || 'OTP sent successfully'
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      // Handle specific OTP errors
      if (error.message?.includes('already registered')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      
      throw error;
    }
  }

  async verifyOTP(email: string, otp: string, otpId?: string, userName?: string, role?: string, userPhone?: string) {
    try {
      console.log('Verifying OTP:', { email, role });
      
      const body = userName 
        ? { email, otp, userName, role, phonenumber: userPhone }
        : { email, otp, otpId };
      
      const response = await this.makeRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      if (response.token) {
        await storeAuthData(response);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Handle specific OTP errors
      if (error.message?.includes('Invalid OTP')) {
        throw new Error('Invalid OTP. Please check and try again.');
      }
      
      if (error.message?.includes('expired')) {
        throw new Error('OTP has expired. Please request a new one.');
      }
      
      throw error;
    }
  }

  async verifySignupOTP(email: string, otp: string, userName: string, role: string, userPhone: string) {
    try {
      console.log('Verifying Signup OTP:', { email, role });

      const response = await this.makeRequest('/signup/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, name: userName, role, phone: userPhone })
      });

      if (response.token) {
        await storeAuthData(response);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('Signup OTP verification error:', error);

      if (error.message?.includes('Invalid OTP')) {
        throw new Error('Invalid OTP. Please check and try again.');
      }

      if (error.message?.includes('expired')) {
        throw new Error('OTP has expired. Please request a new one.');
      }

      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      console.log('Forgot password:', { email });
      
      const response = await this.makeRequest('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return response;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      console.log('Reset password:', { token });
      
      const response = await this.makeRequest('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      
      return response;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await this.makeRequest('/profile');
      return response;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(userData: any) {
    try {
      console.log('Update profile:', userData);
      
      const response = await this.makeRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      
      return response;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async storeAuthData(authData: any) {
    try {
      await storeAuthData(authData);
      console.log('Auth data stored successfully');
    } catch (error: any) {
      console.error('Store auth data error:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  async logout() {
    try {
      await clearAllStorage();
      console.log('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout properly');
    }
  }

  async updateRole(email: string, role: string) {
    try {
      console.log('Updating role:', { email, role });

      const response = await this.makeRequest('/update-role', {
        method: 'POST',
        body: JSON.stringify({ email, role })
      });

      console.log('Role update response:', response);
      return response;
    } catch (error: any) {
      console.error('Update role error:', error);
      throw new Error(error.message || 'Failed to update role');
    }
  }
}

export default new AuthService();
