import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import { RedHatDisplay_400Regular, RedHatDisplay_500Medium, RedHatDisplay_600SemiBold, RedHatDisplay_700Bold } from '@expo-google-fonts/red-hat-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import React from 'react';
import { useColorScheme } from '../hooks/useColorScheme';
import axios from "axios";
import Toast from "react-native-toast-message";
import { View, Platform } from 'react-native';

// Import polyfills for web environment
import '../polyfills';

// Global styles to prevent unwanted cursor behavior
const GlobalStyles = '';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [isMounted, setIsMounted] = React.useState(false);
  const [loaded, fontError] = useFonts({
    Inter_400Regular,
    RedHatDisplay_400Regular,
    RedHatDisplay_500Medium,
    RedHatDisplay_600SemiBold,
    RedHatDisplay_700Bold,
  });

  const fontsReady = loaded || fontError;

  useEffect(() => {
    // Set mounted state after component mounts
    setIsMounted(true);
    
    if (fontsReady) {
      SplashScreen.hideAsync();
    }

    // Inject global styles for web to prevent unwanted cursor behavior
    if (typeof Platform !== 'undefined' && Platform.OS === 'web' && GlobalStyles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = GlobalStyles;
      document.head.appendChild(styleElement);
      
      // Cleanup function
      return () => {
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      };
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
        const response = await origFetch(url, options);

        // Only log response for API calls, not Firestore WebChannel streams
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (!urlStr.includes('firestore.googleapis.com') && !urlStr.includes('webchannel')) {
          const cloned = response.clone();
          const contentType = response.headers.get('content-type') || '';

          try {
            if (contentType.includes('application/json')) {
              const json = await cloned.json();
              console.log("📥 [Fetch Response]:", url);
              console.log("   Body:", json);
            } else {
              const text = await cloned.text();
              // Only log text if it's not too large (avoid binary data)
              if (text.length < 1000) {
                console.log("📥 [Fetch Response]:", url);
                console.log("   Body:", text.substring(0, 200));
              }
            }
          } catch (parseErr) {
            // Silently ignore parse errors - response body may not be readable
          }
        }

        return response;
      } catch (err: any) {
        console.log("❌ [Fetch Error]:", url);
        console.log("   Error:", err?.message || err);
        throw err;
      }
    };




  }, [fontsReady]);

  // Don't return null: render minimal view so the app doesn't close; show app once fonts load or fail
  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  // Prevent rendering during SSR or before mount
  if (!isMounted) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  try {
    return (
      <ThemeProvider value={systemColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    );
  } catch (e) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }
}
