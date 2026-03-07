import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View, Animated, StyleProp,
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
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  fullWidth, loading, disabled, icon, iconRight, style, textStyle,
}) => {
  const isDisabled = disabled || loading;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={[
          styles.base,
          styles[`size_${size}`],
          styles[`variant_${variant}`],
          fullWidth && styles.fullWidthInner,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {/* Glint effect para variant primary */}
        {variant === 'primary' && !isDisabled && (
          <View style={styles.glint} />
        )}

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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft:  { marginRight: 8 },
  iconRight: { marginLeft: 8 },

  // Glint effect (línea diagonal translúcida)
  glint: {
    position: 'absolute',
    top: 0, left: '15%',
    width: '30%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ skewX: '-20deg' }],
    pointerEvents: 'none',
  },

  fullWidth: { width: '100%' },
  fullWidthInner: { width: '100%' },

  // Sizes
  size_sm: { paddingVertical: 9,  paddingHorizontal: 18, borderRadius: 12, minHeight: 38 },
  size_md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, minHeight: 48 },
  size_lg: { paddingVertical: 17, paddingHorizontal: 28, borderRadius: 16, minHeight: 56 },

  // Variants
  variant_primary: {
    backgroundColor: Colors.primary,
    ...Shadow.medium,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  variant_ghost: {
    backgroundColor: Colors.primaryMuted,
  },
  variant_danger: {
    backgroundColor: Colors.error,
    ...Shadow.small,
  },
  variant_success: {
    backgroundColor: Colors.success,
    ...Shadow.small,
  },

  disabled: { opacity: 0.4 },

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
  textSize_lg: { ...Typography.button, fontSize: 16, letterSpacing: 0.4 },

  textDisabled: { opacity: 0.7 },
});
