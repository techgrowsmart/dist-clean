import { getAuthData, storeAuthData } from './authStorage';
import { BASE_URL } from '../config';

/**
 * Enhanced Authentication Helper
 * Provides better error handling and debugging for authentication issues
 */

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  error?: string;
}

/**
 * Enhanced API call with automatic token handling
 */
export const makeAuthenticatedCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // Get auth data
    const authData = await getAuthData();
    
    if (!authData?.token) {
      throw new Error('No authentication token available');
    }

    // Log token info for debugging
    console.log('🔍 Making authenticated call to:', endpoint);
    console.log('🔍 Token exists:', !!authData.token);
    console.log('🔍 Token length:', authData.token.length);
    console.log('🔍 User email:', authData.email);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`,
      ...options.headers
    };

    // Make the call
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle authentication errors
    if (response.status === 401) {
      console.log('❌ Authentication failed - clearing stored data');
      await clearAuthData();
      throw new Error('Authentication expired. Please login again.');
    }

    if (response.status === 403) {
      console.log('❌ Access denied - token may be invalid');
      throw new Error('Access denied. Your session may have expired.');
    }

    return response;
  } catch (error) {
    console.error('❌ Authenticated call failed:', error);
    throw error;
  }
};

/**
 * Enhanced authentication check
 */
export const checkAuthentication = async (): Promise<AuthResponse> => {
  try {
    const authData = await getAuthData();
    
    if (!authData?.token) {
      return {
        success: false,
        message: 'No authentication token found',
        error: 'TOKEN_MISSING'
      };
    }

    // Test the token with a simple API call
    const response = await fetch(`${BASE_URL}/api/test-auth/check-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: authData.token })
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: 'Authentication valid',
        user: result.decoded,
        token: authData.token
      };
    } else {
      // Token is invalid, clear it
      await clearAuthData();
      return {
        success: false,
        message: result.message || 'Invalid token',
        error: 'TOKEN_INVALID'
      };
    }
  } catch (error) {
    console.error('❌ Authentication check failed:', error);
    return {
      success: false,
      message: 'Authentication check failed',
      error: 'CHECK_FAILED'
    };
  }
};

/**
 * Store authentication data with validation
 */
export const storeAuthDataEnhanced = async (authData: {
  email: string;
  role: string;
  token: string;
  name?: string;
  profileImage?: string;
}): Promise<AuthResponse> => {
  try {
    // Validate required fields
    if (!authData.email || !authData.role || !authData.token) {
      return {
        success: false,
        message: 'Missing required authentication data',
        error: 'INVALID_DATA'
      };
    }

    // Store the data
    await storeAuthData(authData);

    // Verify it was stored correctly
    const storedData = await getAuthData();
    
    if (!storedData?.token || storedData.token !== authData.token) {
      return {
        success: false,
        message: 'Failed to store authentication data',
        error: 'STORAGE_FAILED'
      };
    }

    return {
      success: true,
      message: 'Authentication data stored successfully',
      user: storedData,
      token: authData.token
    };
  } catch (error) {
    console.error('❌ Failed to store auth data:', error);
    return {
      success: false,
      message: 'Failed to store authentication data',
      error: 'STORAGE_ERROR'
    };
  }
};

/**
 * Clear authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    const { clearAllStorage } = require('./authStorage');
    await clearAllStorage();
    console.log('✅ Authentication data cleared');
  } catch (error) {
    console.error('❌ Failed to clear auth data:', error);
  }
};

/**
 * Get current authentication status
 */
export const getCurrentAuthStatus = async () => {
  try {
    const authData = await getAuthData();
    
    if (!authData) {
      return {
        isAuthenticated: false,
        reason: 'NO_AUTH_DATA'
      };
    }

    if (!authData.token) {
      return {
        isAuthenticated: false,
        reason: 'NO_TOKEN',
        userData: authData
      };
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(authData.token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp < now) {
        await clearAuthData();
        return {
          isAuthenticated: false,
          reason: 'TOKEN_EXPIRED',
          userData: authData
        };
      }

      return {
        isAuthenticated: true,
        reason: 'VALID_TOKEN',
        userData: authData,
        tokenExpiresAt: new Date(payload.exp * 1000).toISOString()
      };
    } catch (tokenError) {
      return {
        isAuthenticated: false,
        reason: 'INVALID_TOKEN_FORMAT',
        userData: authData
      };
    }
  } catch (error) {
    console.error('❌ Failed to get auth status:', error);
    return {
      isAuthenticated: false,
      reason: 'STATUS_CHECK_FAILED'
    };
  }
};

/**
 * Refresh authentication if needed
 */
export const refreshAuthenticationIfNeeded = async (): Promise<AuthResponse> => {
  const status = await getCurrentAuthStatus();
  
  if (status.isAuthenticated) {
    return {
      success: true,
      message: 'Authentication is valid',
      user: status.userData
    };
  }

  if (status.reason === 'TOKEN_EXPIRED' || status.reason === 'INVALID_TOKEN_FORMAT') {
    return {
      success: false,
      message: 'Authentication expired. Please login again.',
      error: status.reason
    };
  }

  return {
    success: false,
    message: 'Authentication required',
    error: status.reason
  };
};

export default {
  makeAuthenticatedCall,
  checkAuthentication,
  storeAuthDataEnhanced,
  clearAuthData,
  getCurrentAuthStatus,
  refreshAuthenticationIfNeeded
};
