import { Platform } from 'react-native';

// Dynamic IP detection for development
const getBaseUrl = () => {
  // Use environment variable if available
  let url = process.env.EXPO_PUBLIC_API_URL;
  
  if (!url) {
    // For local development, use local IP
    url = "http://172.17.2.72:3000";
  }

  // Android emulator: 127.0.0.1 points to the emulator itself, not the host.
  // Use 10.0.2.2 to reach the host machine's localhost.
  if (Platform.OS === 'android' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
    url = url.replace(/127\.0\.0\.1|localhost/g, '10.0.2.2');
  }
  console.log('Using API URL:', url);
  return url;
};

// Use production API for stability in emulator/dev when local backend isn't reachable
export const BASE_URL = getBaseUrl();
export const RAZOR_PAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_RY9WNGFa44XzaQ';
