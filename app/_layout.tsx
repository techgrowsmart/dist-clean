import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import React from 'react';
import { useColorScheme } from '../hooks/useColorScheme';
import axios from "axios";
import { Platform } from 'react-native';
import Toast from "react-native-toast-message";
import { View ,Text} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }

    // --- Axios Interceptors ---
    axios.interceptors.request.use((config) => {
      console.log("📤 [Axios Request]:", config.url);
      if (config.data) {
        console.log("   Payload:", config.data);
      }
      return config;
    });

    axios.interceptors.response.use(
        (res) => {
          console.log("📥 [Axios Response]:", res.config.url);
          console.log("   Body:", res.data);
          return res;
        },
        (error) => {
          console.log("❌ [Axios Error]:", error.config?.url);
          if (error?.response?.data) {
            console.log("   Error Body:", error.response.data);
          } else {
            console.log("   Error:", error.message);
          }
          return Promise.reject(error);
        }
    );

    // --- Fetch Override ---
    const origFetch = global.fetch;
    global.fetch = async (...args) => {
      const [url, options] = args;

      console.log("📤 [Fetch Request]:", url);
      if (options?.body) {
        console.log("   Payload:", options.body);
      }

      try {
        const response = await origFetch(...args);
        const cloned = response.clone();

        try {
          const json = await cloned.json();
          console.log("📥 [Fetch Response]:", url);
          console.log("   Body:", json);
        } catch {
          const text = await cloned.text();
          console.log("📥 [Fetch Response]:", url);
          console.log("   Body:", text);
        }

        return response;
      } catch (err: any) {
        console.log("❌ [Fetch Error]:", url);
        console.log("   Error:", err?.message || err);
        throw err;
      }
    };




  }, [loaded]);


  if (!loaded) {
    return null;
  }


  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}
