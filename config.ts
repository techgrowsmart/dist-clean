// Dynamic IP detection for development
const getBaseUrl = () => {
  // Use environment variable if available
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    console.log('Using API URL from environment:', envUrl);
    return envUrl;
  }
  
  // Fallback to production URL
  const productionUrl = "https://growsmartserver.gogrowsmart.com";
  console.log('Using fallback API URL:', productionUrl);
  return productionUrl;
};

export const BASE_URL = getBaseUrl();
// export const BASE_URL = "http://127.0.0.1:3000";
// export const BASE_URL = "https://growsmartserver.gogrowsmart.com"
export const RAZOR_PAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY || 'rzp_test_RY9WNGFa44XzaQ';
