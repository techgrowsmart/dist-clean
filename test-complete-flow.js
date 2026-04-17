// Test complete flow: frontend authService with backend
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Simulate the authService.sendOTP method
async function sendOTP(email, password, isSignup = false, name, phone) {
  try {
    console.log('🔐 Sending OTP:', { email, isSignup, phone });
    
    // For signup, check if user already exists before sending OTP
    if (isSignup) {
      const userCheck = await checkUserExists(email);
      if (userCheck.exists) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
    }
    
    const endpoint = isSignup ? '/signup' : '/auth/login';
    const phoneNumber = phone && phone.trim() ? phone : '+0000000000';
    const body = isSignup 
      ? { email, fullName: name, phonenumber: phoneNumber, role: 'student' }
      : { email, password };
    
    const response = await axios.post(`${BASE_URL}/api${endpoint}`, body);
    
    return {
      success: true,
      otpId: response.data.otpId,
      message: response.data.message || 'OTP sent successfully'
    };
  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    throw error;
  }
}

async function checkUserExists(email) {
  try {
    console.log('🔍 Checking if user exists:', { email });
    
    const response = await axios.post(`${BASE_URL}/api/auth/check-user`, {
      email
    });
    
    return {
      exists: response.data.exists || false,
      message: response.data.message || ''
    };
  } catch (error) {
    console.error('❌ Check user exists error:', error.message);
    // If the endpoint doesn't exist, assume user doesn't exist to allow signup
    if (error.message?.includes('Not found') || error.message?.includes('404')) {
      return { exists: false, message: '' };
    }
    throw error;
  }
}

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete frontend flow...\n');

    // Test 1: New user signup (should work)
    console.log('Test 1: New user signup attempt');
    try {
      const result = await sendOTP('newuser@example.com', '', true, 'New User', '+1234567890');
      console.log('✅ New user signup successful:', result);
    } catch (error) {
      console.log('❌ New user signup failed:', error.message);
    }
    console.log();

    // Test 2: Existing user signup (should fail)
    console.log('Test 2: Existing user signup attempt');
    try {
      const result = await sendOTP('existing@example.com', '', true, 'Existing User', '+1234567890');
      console.log('❌ Existing user signup should have failed but succeeded:', result);
    } catch (error) {
      console.log('✅ Existing user signup correctly blocked:', error.message);
    }
    console.log();

    // Test 3: Login attempt for existing user (should work)
    console.log('Test 3: Login attempt for existing user');
    try {
      const result = await sendOTP('existing@example.com', '', false);
      console.log('✅ Login OTP sent successfully:', result);
    } catch (error) {
      console.log('❌ Login failed:', error.message);
    }
    console.log();

    console.log('🎉 Complete flow testing finished!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();
