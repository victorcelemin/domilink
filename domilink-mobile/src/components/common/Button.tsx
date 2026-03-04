import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  fullWidth, loading, disabled, icon, iconRight, style, textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <View style={styles.inner}>
          {icon && !iconRight && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            isDisabled && styles.textDisabled,
            textStyle,
          ]}>
            {title}
          </Text>
          {icon && iconRight && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Shadow.small,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft:  { marginRight: 8 },
  iconRight: { marginLeft: 8 },

  fullWidth: { width: '100%' },

  // Sizes
  size_sm: { paddingVertical: 8,  paddingHorizontal: 16, borderRadius: 10 },
  size_md: { paddingVertical: 13, paddingHorizontal: 24, borderRadius: 14 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16 },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...{ shadowOpacity: 0, elevation: 0 },
  },
  variant_ghost: {
    backgroundColor: Colors.primaryMuted,
    ...{ shadowOpacity: 0, elevation: 0 },
  },
  variant_danger: {
    backgroundColor: Colors.error,
  },
  variant_success: {
    backgroundColor: Colors.success,
  },

  disabled: { opacity: 0.45 },

  // Text
  text: {
    ...Typography.button,
    textAlign: 'center',
  },
  text_primary: { color: Colors.white },
  text_outline:  { color: Colors.primary },
  text_ghost:    { color: Colors.primary },
  text_danger:   { color: Colors.white },
  text_success:  { color: Colors.white },

  textSize_sm: { ...Typography.buttonSm },
  textSize_md: { ...Typography.button },
  textSize_lg: { ...Typography.button, fontSize: 16 },

  textDisabled: { opacity: 0.7 },
});
