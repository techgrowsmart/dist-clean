import { useRouter } from 'expo-router';

/**
 * Safely navigates back if possible, otherwise navigates to a fallback route
 * @param fallbackRoute - The route to navigate to if there's no history to go back to
 * @returns void
 */
export const useSafeBack = () => {
  const router = useRouter();

  const safeBack = (fallbackRoute?: string) => {
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.push(fallbackRoute as any);
    }
    // If no fallback route is provided and can't go back, do nothing
  };

  return { safeBack };
};

/**
 * A standalone function for safe back navigation
 * @param router - The router instance
 * @param fallbackRoute - The route to navigate to if there's no history to go back to
 */
export const safeBack = (router: ReturnType<typeof useRouter>, fallbackRoute?: string) => {
  if (router.canGoBack()) {
    router.back();
  } else if (fallbackRoute) {
    router.push(fallbackRoute as any);
  }
  // If no fallback route is provided and can't go back, do nothing
};
