// Backend URL configuration
const isDevelopment = __DEV__; // React Native's development flag

export const BASE_URL = isDevelopment 
  ? "http://localhost:3000"  // Local HTTP backend
  : "https://growsmartserver.gogrowsmart.com";  // Production backend

export const RAZOR_PAY_KEY = 'rzp_test_RY9WNGFa44XzaQ';
export const PORTAL_DOMAIN = 'portal.gogrowsmart.com';

console.log('🔗 Using BASE_URL:', BASE_URL);
