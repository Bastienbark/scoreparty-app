import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * React Native's Alert.alert is a no-op on web (react-native-web ships an
 * empty stub) — it neither shows a dialog nor calls any callback. This
 * wrapper falls back to window.confirm/alert on web so confirmations and
 * notices actually work across native and web/PWA builds.
 */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${opts.title}\n\n${opts.message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(opts.title, opts.message, [
      { text: opts.cancelLabel ?? 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: opts.confirmLabel ?? 'Confirmer', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
