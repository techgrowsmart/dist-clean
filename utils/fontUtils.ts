// Font loading optimization to prevent timeout issues
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';

export const useOptimizedFonts = (fontConfig: any) => {
  const [fontsLoaded] = useFonts(fontConfig);
  const [fontTimeout, setFontTimeout] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set a timeout for font loading
    const timeoutId = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading timeout - proceeding with default fonts');
        setFontTimeout(true);
        setIsReady(true);
      }
    }, 3000); // 3 second timeout instead of 6 seconds

    if (fontsLoaded) {
      clearTimeout(timeoutId);
      setIsReady(true);
    }

    return () => clearTimeout(timeoutId);
  }, [fontsLoaded]);

  return { 
    fontsLoaded: fontsLoaded || fontTimeout, 
    fontTimeout, 
    isReady 
  };
};
