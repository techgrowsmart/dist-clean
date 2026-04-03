import { Platform } from 'react-native';

// Get API URL from environment with fallback to backend server
const getBaseUrl = () => {
  // Use environment variable if available
  let url = process.env.EXPO_PUBLIC_API_URL;
  
  if (!url) {
    // For development and production, use the deployed backend server
    url = "https://growsmartserver.gogrowsmart.com";
  }

  // Handle localhost/127.0.0.1 for different platforms
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    if (Platform.OS === 'android') {
      // Android emulator: 127.0.0.1 points to the emulator itself, not the host.
      // Use 10.0.2.2 to reach the host machine's localhost.
      url = url.replace(/127\.0\.0\.1|localhost/g, '10.0.2.2');
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost or 127.0.0.1
      // No change needed for iOS
    }
  }
  
  return url;
};

export const BASE_URL = getBaseUrl();
export const RAZOR_PAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_RY9WNGFa44XzaQ';
export const PORTAL_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || 'portal.gogrowsmart.com';
