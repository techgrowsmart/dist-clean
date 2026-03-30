const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  return {
    ...config,
    server: {
      port: 8082,
    },
    resolver: {
      ...config.resolver,
      alias: {
        ...config.resolver.alias,
        // Redirect expo-notifications to our conditional import on web
        'expo-notifications': require.resolve('./utils/notifications.js'),
        // Allow importing from growsmart-ui-screens
        '@ui-screens': '../growsmart-ui-screens/screens',
      },
      platformExtensions: ['ios', 'android', 'native', 'web', 'js', 'ts', 'tsx', 'jsx', 'json'],
    },
    transformer: {
      ...config.transformer,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  };
});
