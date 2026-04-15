// Backend URL configuration
const DEV_SERVER_URL = 'http://localhost:3000';
const PROD_SERVER_URL = 'https://growsmartserver.gogrowsmart.com';

// Use production URL for production, dev URL for development
export const BASE_URL = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_DEV_MODE === 'false'
  ? PROD_SERVER_URL
  : (process.env.EXPO_PUBLIC_API_URL || DEV_SERVER_URL);

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
