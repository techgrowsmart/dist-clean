import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    // Delay navigation to ensure Root Layout is mounted
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/auth/EmailInputScreen' as any,
        params: { type: 'login' }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7C4DDB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
