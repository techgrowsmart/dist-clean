// Backend URL configuration - FORCE DEV MODE
const DEV_SERVER_URL = 'http://localhost:3000';
const PROD_SERVER_URL = 'https://growsmartserver.gogrowsmart.com';

// ALWAYS use dev server for local development
export const BASE_URL = DEV_SERVER_URL;

export const RAZORPAY_KEY = 'rzp_test_RY9WNGFa44XzaQ';
// Alias for backward compatibility - some files import as RAZOR_PAY_KEY
export const RAZOR_PAY_KEY = RAZORPAY_KEY;
export const PORTAL_DOMAIN = 'portal.gogrowsmart.com';

// Log configuration for debugging
console.log('🔗 Development Configuration:', {
  BASE_URL,
  hostname: typeof window !== 'undefined' ? window.location?.hostname : 'N/A',
  environment: 'DEVELOPMENT'
});
