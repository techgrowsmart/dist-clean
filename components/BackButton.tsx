import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  onPress?: () => void;
  size?: number;
  color?: string;
  style?: any;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  size = 24, 
  color = '#4255ff', // Match your app's primary color
  style 
}) => {
  const router = useRouter();

  const handlePress = () => {
    console.log('BackButton handlePress called');
    if (onPress) {
      console.log('Using custom onPress');
      onPress();
    } else {
      console.log('Using default router.back()');
      router.back();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <AntDesign 
        name="arrowleft" 
        size={size} 
        color={color} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    minWidth: 48,
    minHeight: 48,
  },
});

export default BackButton;
