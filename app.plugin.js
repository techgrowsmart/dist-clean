const { withGradleProperties } = require('expo/config-plugins');

/**
 * Expo config plugin to ensure R8 is enabled and mapping file is generated
 * This ensures that the deobfuscation mapping file is created for Google Play Console
 */
module.exports = function withAndroidR8Config(config) {
  return withGradleProperties(config, (config) => {
    // Ensure R8 full mode is enabled for better code shrinking and obfuscation
    config.modResults = config.modResults || [];
    
    // Check if android.enableR8.fullMode already exists
    const r8FullModeIndex = config.modResults.findIndex(
      (item) => item.type === 'property' && item.key === 'android.enableR8.fullMode'
    );
    
    if (r8FullModeIndex === -1) {
      config.modResults.push({
        type: 'property',
        key: 'android.enableR8.fullMode',
        value: 'true',
      });
    } else {
      config.modResults[r8FullModeIndex].value = 'true';
    }

    // Ensure R8 is enabled (this is usually default, but we'll make it explicit)
    const r8Index = config.modResults.findIndex(
      (item) => item.type === 'property' && item.key === 'android.enableR8'
    );
    
    if (r8Index === -1) {
      config.modResults.push({
        type: 'property',
        key: 'android.enableR8',
        value: 'true',
      });
    } else {
      config.modResults[r8Index].value = 'true';
    }

    return config;
  });
};
