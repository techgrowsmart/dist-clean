// Network connectivity test utility
import axios from 'axios';
import { BASE_URL } from '../config';

const testUrls = [
  `${BASE_URL}/api/auth/login`
];

export const testNetworkConnectivity = async () => {
  console.log('🔍 Testing network connectivity...');
  
  for (const url of testUrls) {
    try {
      console.log(`📤 Testing: ${url}`);
      const response = await axios.post(url, 
        { email: 'test@example.com' }, 
        { 
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      console.log(`✅ Success: ${url} - Status: ${response.status}`);
    } catch (error: any) {
      console.log(`❌ Failed: ${url} - Error: ${error.message}`);
    }
  }
};

export default testNetworkConnectivity;
