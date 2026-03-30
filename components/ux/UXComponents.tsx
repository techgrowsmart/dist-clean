import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

// Modern UX Design System
export const UX_COLORS = {
  primary: '#3B5BFE',
  primaryDark: '#2563EB',
  primaryLight: '#EEF2FF',
  secondary: '#64748B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  shadow: 'rgba(0, 0, 0, 0.1)',
  gradient: ['#667eea', '#764ba2'],
};

export const UX_CONSTANTS = {
  borderRadius: {
    small: wp('1%'),
    medium: wp('2%'),
    large: wp('3%'),
    xlarge: wp('5%'),
    full: wp('50%'),
  },
  spacing: {
    xs: hp('0.5%'),
    sm: hp('1%'),
    md: hp('1.5%'),
    lg: hp('2%'),
    xl: hp('3%'),
    xxl: hp('4%'),
  },
  fontSize: {
    xs: wp('2.5%'),
    sm: wp('3%'),
    md: wp('3.5%'),
    lg: wp('4%'),
    xl: wp('5%'),
    xxl: wp('6%'),
  },
  shadows: {
    small: {
      shadowColor: UX_COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: UX_COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: UX_COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Modern Button Component
interface UXButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
}

export const UXButton: React.FC<UXButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const getButtonStyles = () => {
    const baseStyles = [
      styles.button,
      styles[`button_${size}`],
      fullWidth && styles.button_fullWidth,
      disabled && styles.button_disabled,
      style,
    ];

    switch (variant) {
      case 'primary':
        return [...baseStyles, styles.button_primary];
      case 'secondary':
        return [...baseStyles, styles.button_secondary];
      case 'outline':
        return [...baseStyles, styles.button_outline];
      case 'ghost':
        return [...baseStyles, styles.button_ghost];
      default:
        return baseStyles;
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
        return [styles.buttonText, styles.buttonText_primary];
      case 'secondary':
        return [styles.buttonText, styles.buttonText_secondary];
      case 'outline':
        return [styles.buttonText, styles.buttonText_outline];
      case 'ghost':
        return [styles.buttonText, styles.buttonText_ghost];
      default:
        return styles.buttonText;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={getButtonStyles()}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#FFFFFF' : UX_COLORS.primary}
          />
        ) : (
          <View style={styles.buttonContent}>
            {icon && <View style={styles.buttonIcon}>{icon}</View>}
            <Text style={getTextStyles()}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Modern Card Component
interface UXCardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'small' | 'medium' | 'large';
  rounded?: 'sm' | 'md' | 'lg' | 'xlarge';
  backgroundColor?: string;
  onPress?: () => void;
  style?: any;
}

export const UXCard: React.FC<UXCardProps> = ({
  children,
  padding = 'md',
  shadow = 'medium',
  rounded = 'md',
  backgroundColor = UX_COLORS.surface,
  onPress,
  style,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <CardComponent
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.card,
          styles[`card_padding_${padding}`],
          styles[`card_rounded_${rounded}`],
          UX_CONSTANTS.shadows[shadow],
          { backgroundColor },
          style,
        ]}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

// Modern Input Component
interface UXInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: any;
}

export const UXInput: React.FC<UXInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  disabled,
  icon,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapper_focused,
          error && styles.inputWrapper_error,
          disabled && styles.inputWrapper_disabled,
        ]}
      >
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            multiline && styles.input_multiline,
            icon && styles.input_withIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={UX_COLORS.textLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
};

// Loading Spinner Component
interface UXLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export const UXLoading: React.FC<UXLoadingProps> = ({
  size = 'md',
  color = UX_COLORS.primary,
  text,
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 'large';
      default:
        return 'small';
    }
  };

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={getSize()} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

// Status Badge Component
interface UXBadgeProps {
  text: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'primary';
  size?: 'sm' | 'md';
}

export const UXBadge: React.FC<UXBadgeProps> = ({
  text,
  variant = 'primary',
  size = 'md',
}) => {
  return (
    <View
      style={[
        styles.badge,
        styles[`badge_${variant}`],
        styles[`badge_${size}`],
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          styles[`badgeText_${variant}`],
          styles[`badgeText_${size}`],
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  // Button Styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: UX_CONSTANTS.borderRadius.medium,
    ...UX_CONSTANTS.shadows.medium,
  },
  button_sm: {
    paddingVertical: UX_CONSTANTS.spacing.sm,
    paddingHorizontal: UX_CONSTANTS.spacing.lg,
  },
  button_md: {
    paddingVertical: UX_CONSTANTS.spacing.md,
    paddingHorizontal: UX_CONSTANTS.spacing.xl,
  },
  button_lg: {
    paddingVertical: UX_CONSTANTS.spacing.lg,
    paddingHorizontal: UX_CONSTANTS.spacing.xxl,
  },
  button_fullWidth: {
    width: '100%',
  },
  button_disabled: {
    opacity: 0.6,
  },
  button_primary: {
    backgroundColor: UX_COLORS.primary,
  },
  button_secondary: {
    backgroundColor: UX_COLORS.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UX_COLORS.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: UX_CONSTANTS.spacing.sm,
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: UX_CONSTANTS.fontSize.md,
  },
  buttonText_primary: {
    color: '#FFFFFF',
  },
  buttonText_secondary: {
    color: '#FFFFFF',
  },
  buttonText_outline: {
    color: UX_COLORS.primary,
  },
  buttonText_ghost: {
    color: UX_COLORS.primary,
  },

  // Card Styles
  card: {
    backgroundColor: UX_COLORS.surface,
  },
  card_padding_sm: {
    padding: UX_CONSTANTS.spacing.sm,
  },
  card_padding_md: {
    padding: UX_CONSTANTS.spacing.md,
  },
  card_padding_lg: {
    padding: UX_CONSTANTS.spacing.lg,
  },
  card_rounded_sm: {
    borderRadius: UX_CONSTANTS.borderRadius.small,
  },
  card_rounded_md: {
    borderRadius: UX_CONSTANTS.borderRadius.medium,
  },
  card_rounded_lg: {
    borderRadius: UX_CONSTANTS.borderRadius.large,
  },
  card_rounded_xlarge: {
    borderRadius: UX_CONSTANTS.borderRadius.xlarge,
  },

  // Input Styles
  inputContainer: {
    marginBottom: UX_CONSTANTS.spacing.md,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: UX_CONSTANTS.fontSize.sm,
    color: UX_COLORS.text,
    marginBottom: UX_CONSTANTS.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UX_COLORS.border,
    borderRadius: UX_CONSTANTS.borderRadius.medium,
    backgroundColor: UX_COLORS.surface,
  },
  inputWrapper_focused: {
    borderColor: UX_COLORS.primary,
    ...UX_CONSTANTS.shadows.small,
  },
  inputWrapper_error: {
    borderColor: UX_COLORS.error,
  },
  inputWrapper_disabled: {
    backgroundColor: UX_COLORS.background,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: UX_CONSTANTS.fontSize.md,
    color: UX_COLORS.text,
    paddingVertical: UX_CONSTANTS.spacing.md,
    paddingHorizontal: UX_CONSTANTS.spacing.md,
  },
  input_multiline: {
    textAlignVertical: 'top',
    minHeight: hp('12%'),
  },
  input_withIcon: {
    paddingLeft: UX_CONSTANTS.spacing.xl,
  },
  inputIcon: {
    position: 'absolute',
    left: UX_CONSTANTS.spacing.md,
    zIndex: 1,
  },
  inputError: {
    fontFamily: 'Poppins_400Regular',
    fontSize: UX_CONSTANTS.fontSize.sm,
    color: UX_COLORS.error,
    marginTop: UX_CONSTANTS.spacing.xs,
  },

  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: UX_CONSTANTS.spacing.lg,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: UX_CONSTANTS.fontSize.sm,
    color: UX_COLORS.textSecondary,
    marginTop: UX_CONSTANTS.spacing.sm,
  },

  // Badge Styles
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: UX_CONSTANTS.spacing.sm,
    paddingVertical: UX_CONSTANTS.spacing.xs,
    borderRadius: UX_CONSTANTS.borderRadius.xlarge,
  },
  badge_sm: {
    paddingHorizontal: UX_CONSTANTS.spacing.xs,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: UX_CONSTANTS.spacing.sm,
    paddingVertical: UX_CONSTANTS.spacing.xs,
  },
  badge_primary: {
    backgroundColor: UX_COLORS.primary,
  },
  badge_success: {
    backgroundColor: UX_COLORS.success,
  },
  badge_error: {
    backgroundColor: UX_COLORS.error,
  },
  badge_warning: {
    backgroundColor: UX_COLORS.warning,
  },
  badge_info: {
    backgroundColor: UX_COLORS.info,
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: UX_CONSTANTS.fontSize.xs,
  },
  badgeText_sm: {
    fontSize: UX_CONSTANTS.fontSize.xs * 0.8,
  },
  badgeText_md: {
    fontSize: UX_CONSTANTS.fontSize.xs,
  },
  badgeText_primary: {
    color: '#FFFFFF',
  },
  badgeText_success: {
    color: '#FFFFFF',
  },
  badgeText_error: {
    color: '#FFFFFF',
  },
  badgeText_warning: {
    color: '#FFFFFF',
  },
  badgeText_info: {
    color: '#FFFFFF',
  },
});

export default {
  UXButton,
  UXCard,
  UXInput,
  UXLoading,
  UXBadge,
  UX_COLORS,
  UX_CONSTANTS,
};
