// Simple fix for subject count stability
// This file contains the key improvements needed

// 1. Add better caching to prevent flickering
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 2. Only update subject count if it actually changes
const updateSubjectCount = (newCount: number, currentCount: number) => {
  if (currentCount === 0 || currentCount !== newCount) {
    console.log(`Updating subject count from ${currentCount} to ${newCount}`);
    return newCount;
  }
  return currentCount;
};

// 3. Add debouncing to prevent rapid API calls
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 4. Cache validation
const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export { updateSubjectCount, debounce, isCacheValid };
