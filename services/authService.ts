import { BASE_URL } from '../config';
import { storeAuthData, getAuthData, clearAllStorage } from '../utils/authStorage';

// Development mode flag
const IS_DEVELOPMENT_MODE = true; // Enable fallback due to backend 500 errors

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  isTestUser?: boolean;
  isRegistered?: boolean;
  status?: string;
  otpId?: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  otpId?: string;
  email?: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  otpId?: string;
}

class AuthService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      // For development mode, use mock responses directly
      if (IS_DEVELOPMENT_MODE) {
        console.log('🔄 Development mode: Using mock responses');
        return this.getMockResponse(endpoint, options);
      }

      const url = `${BASE_URL}${endpoint}`;
      
      // Get auth token for authenticated requests
      const authData = await getAuthData();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (authData?.token) {
        headers['Authorization'] = `Bearer ${authData.token}`;
      }

      // Add timeout to prevent hanging
      const response = await Promise.race([
        fetch(url, {
          ...options,
          headers,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
        )
      ]) as Response;

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Network Error - Server returned HTML instead of JSON');
      }

      // Clone response before reading to avoid "body stream already read" error
      const clonedResponse = response.clone();
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error('API request error:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        endpoint,
        method: options.method,
        isDevelopmentMode: IS_DEVELOPMENT_MODE
      });
      throw error;
    }
  }

  // Send OTP for email verification (login)
  async sendOTP(email: string, role: string): Promise<OTPResponse> {
    try {
      // Basic email validation
      if (!email || typeof email !== 'string') {
        throw new Error('Please enter a valid email address');
      }

      // Trim whitespace
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        throw new Error('Please enter a valid email address');
      }

      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail }),
      });

      return {
        success: true,
        message: response.message || 'OTP sent successfully',
        otpId: response.otpId,
        email: trimmedEmail,
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      // Check if it's a "not registered" error to trigger signup flow
      if (error.message.includes('not registered') || error.message.includes('sign up')) {
        throw error; // Re-throw to handle signup flow
      }
      
      // Provide more specific error messages
      if (error.message.includes('Failed to send OTP')) {
        throw new Error('Unable to send verification code. Please check your email and try again.');
      } else if (error.message.includes('User not found')) {
        throw new Error('Email not found. Please sign up first.');
      } else {
        throw error;
      }
    }
  }

  // Mock response handler for development mode
  private getMockResponse(endpoint: string, options: any) {
    console.log('🧪 Mock response for:', endpoint);
    
    if (endpoint === '/api/auth/login' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      const email = body.email;
      
      // Test users bypass OTP
      const testUsers = ["student1@example.com", "teacher56@example.com", "teacher31@example.com"];
      if (testUsers.includes(email)) {
        console.log(`🧪 Test user detected: ${email} - Bypassing OTP`);
        const role = email.includes('teacher') ? 'teacher' : 'student';
        const token = 'mock-test-token-' + Date.now();
        
        return {
          message: "✅ Login successful (test user)",
          role: role,
          token: token,
          name: email.split('@')[0],
          isTestUser: true
        };
      }
      
      // Other users get "not registered" to trigger signup
      return {
        message: "Your not registered. Please sign up first.",
        isRegistered: false,
      };
    }
    
    if (endpoint === '/api/signup' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      const email = body.email;
      const name = body.fullName;
      
      return { 
        message: "✅ OTP sent successfully for signup", 
        otpId: 'mock-signup-otp-id-' + Date.now(),
        success: true
      };
    }
    
    if (endpoint === '/api/auth/verify-otp' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      const email = body.email;
      
      return {
        message: "✅ OTP verified successfully",
        role: email.includes('teacher') ? 'teacher' : 'student',
        token: 'mock-verified-token-' + Date.now()
      };
    }
    
    if (endpoint === '/api/signup/verify-otp' && options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      const email = body.email;
      const name = body.name;
      
      return {
        message: "✅ Account created successfully",
        token: 'mock-verified-token-' + Date.now(),
        userId: 'mock-user-' + Date.now(),
        responseTime: 100
      };
    }
    
    // Default fallback
    throw new Error('Mock endpoint not implemented: ' + endpoint);
  }

  // Validate email format and domain
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Verify OTP
  async verifyOTP(email: string, otp: string, otpId?: string): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, otpId }),
      });

      // Store auth data if successful
      if (response.token && response.role) {
        await storeAuthData({
          role: response.role,
          email: response.email || email,
          token: response.token,
          name: response.name,
          profileImage: response.profileImage,
        });
      }

      return {
        success: true,
        token: response.token,
        user: {
          id: response.id || email,
          email: response.email || email,
          name: response.name,
          role: response.role,
          profileImage: response.profileImage,
        },
        isTestUser: response.isTestUser,
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // Verify signup OTP and create account
  async verifySignupOTP(email: string, otp: string, name: string, role: string, phone?: string): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest('/api/signup/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp, name, role, phone }),
      });

      // Store auth data if successful
      if (response.token && response.role) {
        await storeAuthData({
          role: response.role,
          email: response.email || email,
          token: response.token,
          name: response.name || name,
          profileImage: response.profileImage,
        });
      }

      return {
        success: true,
        token: response.token,
        user: {
          id: response.id || email,
          email: response.email || email,
          name: response.name || name,
          role: response.role,
          profileImage: response.profileImage,
        },
      };
    } catch (error: any) {
      console.error('Verify signup OTP error:', error);
      throw error;
    }
  }

  // Update user role after signup
  async updateRole(email: string, role: string): Promise<any> {
    try {
      const response = await this.makeRequest('/api/auth/update-role', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      // Store updated auth data
      if (response.token) {
        await storeAuthData({
          role: role,
          email: email,
          token: response.token,
          name: email.split('@')[0],
        });
      }

      return response;
    } catch (error: any) {
      console.error('Update role error:', error);
      throw error;
    }
  }

  // Login with email and password (if password-based auth exists)
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store auth data if successful
      if (response.token && response.role) {
        await storeAuthData({
          role: response.role,
          email: response.email || email,
          token: response.token,
          name: response.name,
          profileImage: response.profileImage,
        });
      }

      return {
        success: true,
        token: response.token,
        user: {
          id: response.id || email,
          email: response.email || email,
          name: response.name,
          role: response.role,
          profileImage: response.profileImage,
        },
        isTestUser: response.isTestUser,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Signup new user
  async signup(email: string, name: string, role: string, password?: string): Promise<SignupResponse> {
    try {
      // Validate email before signup
      if (!this.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await this.makeRequest('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          fullName: name, 
          phonenumber: '0000000000',
          role: role 
        }),
      });

      return {
        success: true,
        message: response.message || 'User registered successfully',
        user: response.user,
        otpId: response.otpId
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if it exists
      await this.makeRequest('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      await clearAllStorage();
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const authData = await getAuthData();
      return !!(authData && authData.token);
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Get current user data
  async getCurrentUser(): Promise<any> {
    try {
      const authData = await getAuthData();
      if (!authData) return null;

      const response = await this.makeRequest('/api/auth/me');
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    try {
      const response = await this.makeRequest('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.success && response.token) {
        await storeAuthData({ token: response.token });
        return response.token;
      }

      return null;
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }

  // Test user login (for demo purposes) - using same logic as existing Login.tsx
  async testUserLogin(email: string): Promise<LoginResponse> {
    try {
      // Use the existing login endpoint which handles test users
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.isTestUser && response.token && response.role) {
        // Store auth data
        await storeAuthData({
          role: response.role,
          email,
          token: response.token,
          name: response.name,
        });

        return {
          success: true,
          token: response.token,
          user: {
            id: 'test-user-' + Date.now(),
            email,
            name: response.name,
            role: response.role,
          },
          isTestUser: true,
        };
      }

      throw new Error('Invalid test user');
    } catch (error: any) {
      console.error('Test user login error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
