import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export function PWARegister() {
  const { t } = useTranslation();

  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdate = () => {
        if (!navigator.onLine) return;
        registration.update().catch(() => {});
      };

      // Backstop poll for a tab that stays in the foreground indefinitely.
      setInterval(checkForUpdate, 15 * 60 * 1000);

      // Main path: re-check the moment the user returns to the app — installed
      // PWAs (and backgrounded tabs) get reopened far more often than reloaded.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });

      // A deploy may have shipped while the user was offline.
      window.addEventListener('online', checkForUpdate);
    },
    // 'prompt' mode: a new SW has installed and is waiting. Inform the user and
    // let them choose when to reload (tapping Refresh activates it + reloads).
    onNeedRefresh() {
      toast(
        (tt) => (
          <div className="flex items-center gap-3">
            <span className="font-plus-jakarta font-bold text-main-text">
              {t('pwa.update_available')}
            </span>
            <button
              onClick={() => {
                toast.dismiss(tt.id);
                updateServiceWorker(true);
              }}
              className="shrink-0 px-3 py-1.5 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
            >
              {t('pwa.refresh')}
            </button>
          </div>
        ),
        { id: 'pwa-update', duration: Infinity },
      );
    },
  });

  return null;
}
