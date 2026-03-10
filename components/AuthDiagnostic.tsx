import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getCurrentAuthStatus, checkAuthentication } from '../utils/authHelper';

const AuthDiagnostic = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const status = await getCurrentAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus({
        isAuthenticated: false,
        reason: 'ERROR',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runFullAuthCheck = async () => {
    try {
      setLoading(true);
      const result = await checkAuthentication();
      
      Alert.alert(
        'Authentication Check Result',
        `Success: ${result.success}\nMessage: ${result.message}\n${result.error ? `Error: ${result.error}` : ''}`,
        [{ text: 'OK' }]
      );
      
      // Refresh status
      await checkAuthStatus();
    } catch (error) {
      Alert.alert('Error', `Authentication check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      const { clearAuthData } = require('../utils/authHelper');
      await clearAuthData();
      await checkAuthStatus();
      Alert.alert('Success', 'Authentication data cleared');
    } catch (error) {
      Alert.alert('Error', `Failed to clear auth data: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#333' }}>
        🔍 Authentication Diagnostic
      </Text>

      {/* Auth Status Display */}
      <View style={{
        backgroundColor: authStatus?.isAuthenticated ? '#d4edda' : '#f8d7da',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: authStatus?.isAuthenticated ? '#28a745' : '#dc3545'
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>
          Authentication Status
        </Text>
        
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Is Authenticated: {authStatus?.isAuthenticated ? '✅ Yes' : '❌ No'}
        </Text>
        
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Reason: {authStatus?.reason || 'Unknown'}
        </Text>
        
        {authStatus?.error && (
          <Text style={{ fontSize: 14, color: '#dc3545', marginBottom: 8 }}>
            Error: {authStatus.error}
          </Text>
        )}
        
        {authStatus?.tokenExpiresAt && (
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Token Expires: {new Date(authStatus.tokenExpiresAt).toLocaleString()}
          </Text>
        )}
      </View>

      {/* User Data Display */}
      {authStatus?.userData && (
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>
            👤 User Data
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Email: {authStatus.userData.email || 'Not available'}
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Role: {authStatus.userData.role || 'Not available'}
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Name: {authStatus.userData.name || 'Not available'}
          </Text>
          
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            Has Token: {authStatus.userData.token ? '✅ Yes' : '❌ No'}
          </Text>
          
          {authStatus.userData.token && (
            <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
              Token Length: {authStatus.userData.token.length}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' }}>
          🛠️ Actions
        </Text>
        
        <TouchableOpacity
          style={{ backgroundColor: '#007bff', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={checkAuthStatus}
          disabled={loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            🔄 Refresh Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={runFullAuthCheck}
          disabled={loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            🧪 Run Full Auth Check
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#ffc107', padding: 12, borderRadius: 8, marginBottom: 8 }}
          onPress={() => Alert.alert('Debug Info', JSON.stringify(authStatus, null, 2))}
        >
          <Text style={{ color: 'black', textAlign: 'center', fontSize: 16 }}>
            📊 Show Debug Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#dc3545', padding: 12, borderRadius: 8 }}
          onPress={clearAuthData}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            🗑️ Clear Auth Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recommendations */}
      <View style={{ backgroundColor: '#fff3cd', borderRadius: 12, padding: 16, marginBottom: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#856404' }}>
          💡 Recommendations
        </Text>
        
        {authStatus?.isAuthenticated ? (
          <Text style={{ fontSize: 14, color: '#856404', lineHeight: 20 }}>
            ✅ Authentication is working correctly! Your token is valid and you should be able to access protected endpoints.
          </Text>
        ) : (
          <Text style={{ fontSize: 14, color: '#856404', lineHeight: 20 }}>
            {authStatus?.reason === 'NO_AUTH_DATA' && '❌ No authentication data found. Please login again.'}
            {authStatus?.reason === 'NO_TOKEN' && '❌ No token found. Please login again.'}
            {authStatus?.reason === 'TOKEN_EXPIRED' && '❌ Your token has expired. Please login again.'}
            {authStatus?.reason === 'INVALID_TOKEN_FORMAT' && '❌ Token format is invalid. Please login again.'}
            {authStatus?.reason === 'STATUS_CHECK_FAILED' && '❌ Failed to check authentication status. Try logging in again.'}
            {!authStatus?.reason && '❌ Authentication issue detected. Try logging in again.'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default AuthDiagnostic;
