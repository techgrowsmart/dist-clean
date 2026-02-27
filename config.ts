import { Platform } from 'react-native';

// Get API URL from environment with fallback to production
const getBaseUrl = () => {
  // Use environment variable if available
  let url = process.env.EXPO_PUBLIC_API_URL;
  
  if (!url) {
    // Fallback to production API
    url = "https://growsmartserver.gogrowsmart.com";
  }

  // Android emulator: 127.0.0.1 points to the emulator itself, not the host.
  // Use 10.0.2.2 to reach the host machine's localhost.
  if (Platform.OS === 'android' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
    url = url.replace(/127\.0\.0\.1|localhost/g, '10.0.2.2');
  }
  
  return url;
};

export const BASE_URL = getBaseUrl();
export const RAZOR_PAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_RY9WNGFa44XzaQ';
