import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWARegister() {
  useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
  });
  return null;
}
