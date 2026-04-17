// Backend URL configuration
const DEV_SERVER_URL = 'http://localhost:3000';

// Use EXPO_PUBLIC_API_URL if set, otherwise use production URL or dev URL
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : (process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_DEV_MODE === 'false'
    ? 'https://growsmartserver.gogrowsmart.com'
    : DEV_SERVER_URL);

export const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_RY9WNGFa44XzaQ';
// Alias for backward compatibility - some files import as RAZOR_PAY_KEY
export const RAZOR_PAY_KEY = RAZORPAY_KEY;
export const PORTAL_DOMAIN = 'portal.gogrowsmart.com';

// Log configuration for debugging
const isProduction = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_DEV_MODE === 'false';
console.log('🔗 Configuration:', {
  BASE_URL,
  hostname: typeof window !== 'undefined' ? window.location?.hostname : 'N/A',
  environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT'
});
