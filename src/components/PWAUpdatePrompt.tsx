import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function PWAUpdatePrompt() {
  const { t } = useTranslation();
  const toastIdRef = useRef<string | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Re-check for an update every hour while the app stays open.
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toastIdRef.current = toast(
      (toastInstance) => (
        <div className="flex items-center gap-3">
          <span className="font-plus-jakarta font-bold text-main-text">
            {t('pwa.update_available')}
          </span>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(toastInstance.id);
              setNeedRefresh(false);
              updateServiceWorker(true);
            }}
            className="px-3 py-1.5 bg-accent-orange text-white font-plus-jakarta font-bold text-sm rounded-lg border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]"
          >
            {t('pwa.update_now')}
          </button>
        </div>
      ),
      { duration: Infinity, id: 'pwa-update' },
    );

    return () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    };
  }, [needRefresh, setNeedRefresh, updateServiceWorker, t]);

  return null;
}
