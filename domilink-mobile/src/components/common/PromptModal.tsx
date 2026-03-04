import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface PromptModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  visible, title, message, placeholder = '',
  confirmText = 'Confirmar', cancelText = 'Cancelar',
  destructive = false, onConfirm, onCancel,
}) => {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    onConfirm(value);
    setValue('');
  };

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={Colors.textDisabled}
              multiline={false}
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}
                onPress={handleConfirm}
              >
                <Text style={[styles.confirmText, destructive && { color: Colors.error }]}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: 20,
    padding: 24, width: '100%', maxWidth: 360,
  },
  title: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 6 },
  message: { ...Typography.body2, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    ...Typography.body1, color: Colors.textPrimary,
    marginBottom: 20,
  },
  buttons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  confirmBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  confirmBtnDestructive: { backgroundColor: Colors.errorLight },
  confirmText: { ...Typography.button, color: Colors.white },
});
