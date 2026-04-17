// Test the exact flow that happens in EmailInputScreen
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Simulate the exact handleContinue function from EmailInputScreen
async function simulateHandleContinue(email, isLogin = false, fullName = '', phoneNumber = '') {
  try {
    console.log('🎯 Simulating EmailInputScreen.handleContinue');
    console.log('📧 Email:', email);
    console.log('🔄 Is Login:', isLogin);
    console.log('👤 Full Name:', fullName);
    console.log('📱 Phone:', phoneNumber);
    console.log();

    // Basic email validation (same as in the app)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address');
    }

    // For signup, validate name is provided
    if (!isLogin && !fullName.trim()) {
      throw new Error('Please enter your full name');
    }

    console.log('✅ Validations passed, calling authService.sendOTP...');

    // This is the exact call from EmailInputScreen line 63
    const fullPhoneNumber = phoneNumber ? `+91${phoneNumber}` : '+0000000000';
    const response = await sendOTP(email.trim(), '', !isLogin, fullName, fullPhoneNumber);
    
    console.log('🎉 OTP sent successfully:', response);
    return { success: true, response };

  } catch (error) {
    console.error('❌ OTP sending error:', error.message);
    
    // This is the exact error handling from EmailInputScreen lines 104-123
    const errorMessage = error.message || 'Failed to send OTP';
    console.log('🔍 Error message:', errorMessage);
    
    if (errorMessage.toLowerCase().includes('already registered')) {
      console.log('🚫 Showing already registered alert');
      console.log('💬 "This email is already registered. Would you like to login instead?"');
      console.log('🔄 Would redirect to: /auth/EmailInputScreen?type=login');
      return { 
        success: false, 
        error: errorMessage,
        shouldRedirectToLogin: true,
        message: 'User should be redirected to login'
      };
    } else if (errorMessage.toLowerCase().includes('not registered')) {
      console.log('🚫 Showing not registered alert');
      console.log('💬 "This email is not registered. Please sign up to create an account."');
      console.log('🔄 Would redirect to: /auth/EmailInputScreen?type=signup');
      return { 
        success: false, 
        error: errorMessage,
        shouldRedirectToSignup: true,
        message: 'User should be redirected to signup'
      };
    } else {
      console.log('🚫 Showing generic error alert');
      console.log('💬', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

// Copy of authService.sendOTP method
async function sendOTP(email, password, isSignup = false, name, phone) {
  try {
    console.log('📤 authService.sendOTP called with:', { email, isSignup, phone });
    
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
    console.error('❌ authService.sendOTP error:', error.message);
    throw error;
  }
}

async function checkUserExists(email) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/check-user`, { email });
    return {
      exists: response.data.exists || false,
      message: response.data.message || ''
    };
  } catch (error) {
    if (error.message?.includes('Not found') || error.message?.includes('404')) {
      return { exists: false, message: '' };
    }
    throw error;
  }
}

async function runIntegrationTest() {
  try {
    console.log('🧪 EmailInputScreen Integration Test\n');
    console.log('=' .repeat(60));

    // Test 1: New user trying to signup (should work)
    console.log('\n📝 Test 1: New user signup attempt');
    console.log('-'.repeat(40));
    const result1 = await simulateHandleContinue('newuser@test.com', false, 'New User', '9876543210');
    console.log('📊 Result:', result1.success ? 'SUCCESS' : 'FAILED');
    if (!result1.success) console.log('❌ Error:', result1.error);

    // Test 2: Existing user trying to signup (should redirect to login)
    console.log('\n📝 Test 2: Existing user signup attempt');
    console.log('-'.repeat(40));
    const result2 = await simulateHandleContinue('existing@example.com', false, 'Existing User', '9876543210');
    console.log('📊 Result:', result2.success ? 'SUCCESS' : 'FAILED');
    if (!result2.success) {
      console.log('❌ Error:', result2.error);
      if (result2.shouldRedirectToLogin) {
        console.log('✅ Correctly identified existing user and would redirect to login');
      }
    }

    // Test 3: Existing user trying to login (should work)
    console.log('\n📝 Test 3: Existing user login attempt');
    console.log('-'.repeat(40));
    const result3 = await simulateHandleContinue('existing@example.com', true);
    console.log('📊 Result:', result3.success ? 'SUCCESS' : 'FAILED');
    if (!result3.success) console.log('❌ Error:', result3.error);

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Integration test completed!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

runIntegrationTest();
