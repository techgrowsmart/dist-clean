// Test script to verify user existence checking
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserExistence() {
  try {
    console.log('🧪 Testing user existence check functionality...\n');

    // Test 1: Check non-existent user
    console.log('Test 1: Checking non-existent user');
    const response1 = await axios.post(`${BASE_URL}/api/auth/check-user`, {
      email: 'nonexistent@example.com'
    });
    console.log('Response:', response1.data);
    console.log('✅ Expected: exists: false\n');

    // Test 2: Try to signup with a new email (this should work)
    console.log('Test 2: Attempting signup with new email');
    try {
      const response2 = await axios.post(`${BASE_URL}/api/signup`, {
        email: 'newuser@example.com',
        fullName: 'Test User',
        phonenumber: '+1234567890',
        role: 'student'
      });
      console.log('✅ Signup successful:', response2.data);
    } catch (error) {
      console.log('❌ Signup failed:', error.response?.data || error.message);
    }
    console.log();

    // Test 3: Check if the user now exists (should still be false until OTP verification)
    console.log('Test 3: Checking if user exists after signup request');
    const response3 = await axios.post(`${BASE_URL}/api/auth/check-user`, {
      email: 'newuser@example.com'
    });
    console.log('Response:', response3.data);
    console.log('✅ Expected: exists: false (user not fully registered until OTP verification)\n');

    // Test 4: Try signup again with same email (should fail)
    console.log('Test 4: Attempting duplicate signup');
    try {
      const response4 = await axios.post(`${BASE_URL}/api/signup`, {
        email: 'newuser@example.com',
        fullName: 'Another User',
        phonenumber: '+0987654321',
        role: 'student'
      });
      console.log('❌ Duplicate signup should have failed but succeeded:', response4.data);
    } catch (error) {
      console.log('✅ Duplicate signup correctly failed:', error.response?.data || error.message);
    }
    console.log();

    console.log('🎉 User existence check testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserExistence();
