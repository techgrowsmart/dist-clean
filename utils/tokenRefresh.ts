import { getAuthData, storeAuthData } from '../utils/authStorage';
import { BASE_URL } from '../config';
import axios from 'axios';

// Function to refresh user token with role information
export const refreshTokenWithRole = async () => {
  try {
    const authData = await getAuthData();
    
    if (!authData || !authData.email) {
      console.log('No auth data found');
      return false;
    }

    console.log('🔄 Refreshing token for:', authData.email);
    
    const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
      email: authData.email
    });

    if (response.data.success) {
      // Store updated auth data with role and name
      await storeAuthData({
        role: response.data.role || authData.role,
        email: authData.email,
        token: response.data.token,
        name: response.data.name || authData.name,
        profileImage: authData.profileImage
      });

      console.log('✅ Token refreshed successfully');
      console.log('👤 User role:', response.data.role);
      return true;
    } else {
      console.log('❌ Token refresh failed:', response.data.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return false;
  }
};

// Auto-refresh function that can be called on app start
export const autoRefreshToken = async () => {
  const authData = await getAuthData();
  
  // If token exists but role is missing or undefined, refresh it
  if (authData && authData.token && (!authData.role || authData.role === 'undefined')) {
    console.log('🔄 Detected missing role, refreshing token...');
    return await refreshTokenWithRole();
  }
  
  return false;
};
