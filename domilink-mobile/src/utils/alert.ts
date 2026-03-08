/**
 * Cross-platform Alert helpers.
 *
 * React Native's Alert.alert works on iOS and Android natively and falls back
 * to window.alert / window.confirm on web. However the callback-based API
 * (multiple buttons) behaves differently on web — only the last button's
 * handler is guaranteed to run (via window.confirm OK/Cancel mapping).
 *
 * These helpers normalise the behaviour so all platforms work identically.
 */
import { Alert, Platform } from 'react-native';

/**
 * Show an informational alert with a single OK button.
 */
export function showAlert(title: string, message?: string, onOk?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
}

/**
 * Show a confirmation dialog with Cancel / Confirm buttons.
 * Returns a promise that resolves to true if confirmed, false if cancelled.
 */
export function showConfirm(
  title: string,
  message?: string,
  confirmText = 'Confirmar',
  _cancelText = 'Cancelar',
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(message ? `${title}\n\n${message}` : title);
      resolve(ok);
    } else {
      Alert.alert(title, message, [
        { text: _cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, onPress: () => resolve(true) },
      ]);
    }
  });
}

/**
 * Show a destructive confirmation dialog (red confirm button on native).
 */
export function showDestructiveConfirm(
  title: string,
  message?: string,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(message ? `${title}\n\n${message}` : title);
      resolve(ok);
    } else {
      Alert.alert(title, message, [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
      ]);
    }
  });
}
