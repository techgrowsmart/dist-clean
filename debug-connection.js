#!/usr/bin/env node

const http = require('http');
const axios = require('axios');

const BASE_URL = 'http://172.17.2.72:3000';

console.log('🔍 Testing server connection and MongoDB issues...\n');

async function testServerConnection() {
  try {
    console.log('1. Testing basic server connection...');
    const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
    console.log('✅ Server is reachable:', response.status);
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    return false;
  }

  try {
    console.log('\n2. Testing API endpoint without auth...');
    const response = await axios.get(`${BASE_URL}/api/posts/all`, { 
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('📡 API Response status:', error.response.status);
      console.log('📡 API Response data:', error.response.data);
    } else {
      console.log('❌ API call failed:', error.message);
    }
  }

  try {
    console.log('\n3. Testing MongoDB connection via API...');
    // Try different endpoints that might reveal MongoDB status
    const endpoints = [
      '/api/health',
      '/api/status', 
      '/api/mongo-status',
      '/api/users',
      '/api/teacherProfile'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          timeout: 3000,
          validateStatus: (status) => status < 500
        });
        console.log(`✅ ${endpoint}:`, response.status, response.data?.message || 'OK');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️  ${endpoint}: Not found (404)`);
        } else if (error.response?.status < 500) {
          console.log(`📡 ${endpoint}:`, error.response.status, error.response.data?.message || 'Error');
        } else {
          console.log(`❌ ${endpoint}: Server error`);
        }
      }
    }
  } catch (error) {
    console.log('❌ MongoDB test failed:', error.message);
  }

  return true;
}

async function checkNetworkIssues() {
  console.log('\n4. Checking network connectivity...');
  
  try {
    // Test if port 3000 is actually listening
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.connect(3000, '172.17.2.72', function() {
      console.log('✅ Port 3000 is accessible');
      socket.destroy();
    });
    
    socket.on('error', function(err) {
      console.log('❌ Port 3000 connection error:', err.message);
    });
    
    socket.on('timeout', function() {
      console.log('❌ Port 3000 connection timeout');
      socket.destroy();
    });
  } catch (error) {
    console.log('❌ Network check failed:', error.message);
  }
}

async function main() {
  const serverOk = await testServerConnection();
  await checkNetworkIssues();
  
  console.log('\n📋 Summary:');
  console.log('- Server URL:', BASE_URL);
  console.log('- Server status:', serverOk ? '✅ Running' : '❌ Not reachable');
  console.log('- MongoDB: Check backend logs for connection errors');
  console.log('- Auth: API requires proper authentication tokens');
  
  console.log('\n🔧 Recommended fixes:');
  console.log('1. Check backend server logs for MongoDB connection errors');
  console.log('2. Verify MongoDB is running and accessible');
  console.log('3. Check if database name and credentials are correct');
  console.log('4. Ensure proper authentication tokens are being sent from the app');
  console.log('5. Check if CORS is properly configured');
}

main().catch(console.error);
