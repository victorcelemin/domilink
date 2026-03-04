import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle,
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
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? accentColor
    : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, focused && { color: accentColor }]}>
          {label}
        </Text>
      )}

      <View style={[
        styles.inputWrapper,
        { borderColor },
        focused ? styles.focused : undefined,
        !editable ? styles.disabled : undefined,
        error ? styles.errorWrapper : undefined,
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={error ? Colors.error : focused ? accentColor : Colors.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            multiline && { height: numberOfLines * 22, textAlignVertical: 'top', paddingTop: 10 },
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={accentColor}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.rightIconBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
            <Ionicons name={rightIcon} size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },

  label: {
    ...Typography.subtitle2,
    color: Colors.textSecondary,
    marginBottom: 6,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    ...Shadow.xs,
  },

  focused: {
    backgroundColor: Colors.white,
    ...Shadow.small,
  },

  disabled: {
    backgroundColor: Colors.surfaceElevated,
    opacity: 0.7,
  },

  errorWrapper: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },

  leftIcon: { marginRight: 10 },
  rightIconBtn: { padding: 4, marginLeft: 6 },

  input: {
    flex: 1,
    ...Typography.body1,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 5,
  },
});
