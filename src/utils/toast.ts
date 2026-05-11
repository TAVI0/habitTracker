import { Platform, Alert, ToastAndroid } from 'react-native';

/**
 * Show error toast notification
 * Uses native Alert/ToastAndroid for simplicity (can upgrade to react-native-toast-message later)
 */
export function showToast(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Error', message, [{ text: 'OK' }]);
  }
}
