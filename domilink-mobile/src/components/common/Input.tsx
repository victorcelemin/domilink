import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ViewStyle, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  isPassword?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  hint?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  containerStyle?: ViewStyle;
  accentColor?: string;
}

export const Input: React.FC<InputProps> = ({
  label, placeholder, value, onChangeText,
  isPassword, keyboardType, autoCapitalize,
  leftIcon, rightIcon, onRightIconPress,
  error, hint, editable = true, multiline,
  numberOfLines = 3, containerStyle,
  accentColor = Colors.primary,
}) => {
  const [focused, setFocused]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animación del label al hacer focus
  const labelAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(labelAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const borderColor = error
    ? Colors.error
    : focused
    ? accentColor
    : Colors.border;

  const iconColor = error
    ? Colors.error
    : focused
    ? accentColor
    : Colors.textTertiary;

  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.textSecondary, accentColor],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.Text style={[styles.label, { color: error ? Colors.error : labelColor }]}>
          {label}
        </Animated.Text>
      )}

      <View style={[
        styles.inputWrapper,
        { borderColor },
        focused ? [styles.focused, { borderColor }] : undefined,
        !editable ? styles.disabled : undefined,
        error ? styles.errorWrapper : undefined,
      ]}>
        {/* Indicador de foco lateral */}
        {focused && !error && (
          <View style={[styles.focusBar, { backgroundColor: accentColor }]} />
        )}

        {leftIcon && (
          <View style={[
            styles.leftIconBox,
            focused && { backgroundColor: accentColor + '15' },
          ]}>
            <Ionicons name={leftIcon} size={17} color={iconColor} />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && { height: numberOfLines * 24, textAlignVertical: 'top', paddingTop: 12 },
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textDisabled}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (isPassword ? 'none' : 'sentences')}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={accentColor}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(s => !s)}
            style={styles.rightIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIcon} size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorIconBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 18 },

  label: {
    ...Typography.subtitle2,
    marginBottom: 8,
    letterSpacing: 0.1,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingRight: 14,
    minHeight: 52,
    overflow: 'hidden',
    ...Shadow.xs,
    position: 'relative',
  },

  // Barra lateral de foco
  focusBar: {
    position: 'absolute',
    left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2,
  },

  focused: {
    backgroundColor: Colors.white,
    ...Shadow.small,
  },

  disabled: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.65,
  },

  errorWrapper: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },

  leftIconBox: {
    width: 46, height: '100%',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 0,
    marginLeft: 2,
  },

  rightIconBtn: {
    padding: 4, marginLeft: 6,
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },

  errorIconBox: {
    marginLeft: 4,
  },

  input: {
    flex: 1,
    ...Typography.body1,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingLeft: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '500',
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 5,
    paddingLeft: 4,
  },
});
