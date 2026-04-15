import React from 'react';
import { Platform } from 'react-native';
// Use appropriate spotlight screen based on platform
import SpotlightScreen from '../../../components/teacher/SpotlightScreen';
import SpotlightScreenWeb from '../../../components/teacher/SpotlightScreenWeb';

const SpotlightsPage: React.FC = () => {
	// Use web version for web platform, mobile version for others
	return (
		Platform.OS === 'web' ? <SpotlightScreenWeb /> : <SpotlightScreen />
	);
};

export default SpotlightsPage;

