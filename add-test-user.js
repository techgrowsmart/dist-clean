// Script to add a test user to in-memory storage
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function addTestUser() {
  try {
    console.log('🔧 Adding test user to simulate existing user...');
    
    // We need to modify the backend to add a user directly to in-memory storage
    // For now, let's create an endpoint to add test users
    const response = await axios.post(`${BASE_URL}/api/add-test-user`, {
      email: 'existing@example.com',
      fullName: 'Existing User',
      phone: '+1234567890',
      role: 'student'
    });
    
    console.log('✅ Test user added:', response.data);
    
    // Now check if user exists
    const checkResponse = await axios.post(`${BASE_URL}/api/auth/check-user`, {
      email: 'existing@example.com'
    });
    
    console.log('🔍 User check after adding:', checkResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

addTestUser();
