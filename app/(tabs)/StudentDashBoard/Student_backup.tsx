import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  console.log('🚀 Home component started');
  
  // Simple test component to verify rendering works
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Screen</Text>
      <Text style={styles.subtitle}>If you see this, basic rendering works!</Text>
      <Text style={styles.subtitle}>Black screen issue is fixed!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
});
