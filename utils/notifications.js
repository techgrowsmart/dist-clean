// Conditional import for expo-notifications to avoid web issues
let Notifications;

try {
  // Only import expo-notifications on native platforms
  if (typeof window === 'undefined' || (window.navigator && window.navigator.product === 'ReactNative')) {
    Notifications = require('expo-notifications');
  } else {
    // Web fallback
    Notifications = {
      setNotificationHandler: () => Promise.resolve(),
      getNotificationPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
      requestPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
      getExpoPushTokenAsync: () => Promise.reject(new Error('Push notifications not supported on web')),
      scheduleNotificationAsync: () => Promise.reject(new Error('Notifications not supported on web')),
      cancelScheduledNotificationAsync: () => Promise.resolve(),
      dismissNotificationAsync: () => Promise.resolve(),
      dismissAllNotificationsAsync: () => Promise.resolve(),
      getBadgeCountAsync: () => Promise.resolve(0),
      setBadgeCountAsync: () => Promise.resolve(),
      addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
      addNotificationReceivedListener: () => ({ remove: () => {} }),
      removeNotificationSubscription: () => {},
      getDevicePushTokenAsync: () => Promise.reject(new Error('Push notifications not supported on web')),
    };
  }
} catch (error) {
  console.warn('expo-notifications not available:', error.message);
  // Fallback implementation
  Notifications = {
    setNotificationHandler: () => Promise.resolve(),
    getNotificationPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
    requestPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
    getExpoPushTokenAsync: () => Promise.reject(new Error('Push notifications not available')),
    scheduleNotificationAsync: () => Promise.reject(new Error('Notifications not available')),
    cancelScheduledNotificationAsync: () => Promise.resolve(),
    dismissNotificationAsync: () => Promise.resolve(),
    dismissAllNotificationsAsync: () => Promise.resolve(),
    getBadgeCountAsync: () => Promise.resolve(0),
    setBadgeCountAsync: () => Promise.resolve(),
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
    addNotificationReceivedListener: () => ({ remove: () => {} }),
    removeNotificationSubscription: () => {},
    getDevicePushTokenAsync: () => Promise.reject(new Error('Push notifications not available')),
  };
}

export default Notifications;
