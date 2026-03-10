import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { BASE_URL } from '../config';
import { getAuthData, getAuthToken } from '../utils/authStorage';

const AuthTest = () => {
  const [authData, setAuthData] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const data = await getAuthData();
      const authToken = await getAuthToken();
      setAuthData(data);
      setToken(authToken || '');
    } catch (error) {
      console.error('Error loading auth data:', error);
    }
  };

  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testPublicEndpoint = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/test-auth/public`);
      const result = await response.json();
      
      addTestResult(
        'Public Endpoint',
        response.ok,
        response.ok ? '✅ Success' : '❌ Failed',
        result
      );
    } catch (error) {
      addTestResult('Public Endpoint', false, `❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testProtectedEndpoint = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/test-auth/protected`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      addTestResult(
        'Protected Endpoint',
        response.ok,
        response.ok ? '✅ Success' : '❌ Failed',
        result
      );
    } catch (error) {
      addTestResult('Protected Endpoint', false, `❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testTokenVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/test-auth/check-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      const result = await response.json();
      
      addTestResult(
        'Token Verification',
        response.ok,
        response.ok ? '✅ Valid Token' : '❌ Invalid Token',
        result
      );
    } catch (error) {
      addTestResult('Token Verification', false, `❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testFavoritesAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/favorites/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      addTestResult(
        'Favorites API',
        response.ok,
        response.ok ? '✅ Success' : '❌ Failed',
        result
      );
    } catch (error) {
      addTestResult('Favorites API', false, `❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const showTokenDetails = () => {
    if (!token) {
      Alert.alert('Token Info', 'No token available');
      return;
    }

    try {
      // Decode JWT without verification to see payload
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      Alert.alert(
        'Token Details',
        `Email: ${decoded.email}\nRole: ${decoded.role}\nName: ${decoded.name}\nIssued At: ${new Date(decoded.iat * 1000).toLocaleString()}\nExpires At: ${new Date(decoded.exp * 1000).toLocaleString()}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Token Info', 'Invalid token format');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#333' }}>
        🔐 Authentication Test
      </Text>

      {/* Auth Data Display */}
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>
          📋 Current Auth Data
        </Text>
        
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Email: {authData?.email || 'Not available'}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Role: {authData?.role || 'Not available'}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Name: {authData?.name || 'Not available'}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Token: {token ? 'Available' : 'Not available'}
        </Text>
        
        <TouchableOpacity
          style={{ backgroundColor: '#007bff', padding: 8, borderRadius: 6, marginTop: 8 }}
          onPress={showTokenDetails}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 14 }}>
            🔍 Show Token Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test Buttons */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>
          🧪 Run Tests
        </Text>
        
        <TouchableOpacity
          style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testPublicEndpoint}
          disabled={loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            Test Public Endpoint
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#ffc107', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testProtectedEndpoint}
          disabled={loading}
        >
          <Text style={{ color: 'black', textAlign: 'center', fontSize: 16 }}>
            Test Protected Endpoint
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#17a2b8', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testTokenVerification}
          disabled={loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            Test Token Verification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#6f42c1', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={testFavoritesAPI}
          disabled={loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            Test Favorites API
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#dc3545', padding: 12, borderRadius: 8 }}
          onPress={clearResults}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>
          📊 Test Results
        </Text>
        
        {testResults.length === 0 ? (
          <Text style={{ color: '#666', fontStyle: 'italic' }}>No tests run yet</Text>
        ) : (
          testResults.map((result, index) => (
            <View
              key={index}
              style={{
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: result.success ? '#28a745' : '#dc3545'
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>
                {result.test}
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                {result.timestamp}
              </Text>
              <Text style={{ fontSize: 13, color: result.success ? '#155724' : '#721c24' }}>
                {result.message}
              </Text>
              {result.data && (
                <Text style={{ fontSize: 11, color: '#666', marginTop: 4, fontFamily: 'monospace' }}>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Manual Token Input */}
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
          🔧 Manual Token Test
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            fontFamily: 'monospace',
            maxHeight: 100
          }}
          value={token}
          onChangeText={setToken}
          placeholder="Paste JWT token here for testing..."
          multiline
        />
      </View>
    </ScrollView>
  );
};

export default AuthTest;
