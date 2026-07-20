import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

interface WebviewWarningModalProps {
  onDismiss: () => void;
}

export function WebviewWarningModal({ onDismiss }: WebviewWarningModalProps) {
  useScrollLock();
  const { t } = useTranslation();

  const handleDismiss = () => {
    sessionStorage.setItem('webview-warning-dismissed', 'true');
    onDismiss();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-plus-jakarta">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="webview-warning-title"
        className="bg-white w-full max-w-md rounded-[24px] border-3 border-main-text shadow-[8px_8px_0px_#1A1A2E] z-10 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent-orange text-white rounded-xl border-2 border-main-text flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
              <AlertTriangle className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <h2 id="webview-warning-title" className="text-xl md:text-2xl font-nunito font-black text-main-text leading-tight">
              {t('webview.title')}
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t('common.close')}
            className="text-main-text hover:text-accent-orange p-1.5 rounded-lg border-2 border-transparent hover:border-main-text hover:bg-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Subtitle / Description Box */}
          <div className="p-4 border-2 border-main-text rounded-2xl bg-page-bg/40 space-y-2 shadow-[2px_2px_0px_#1A1A2E]">
            <p className="text-sm font-semibold text-main-text leading-relaxed">
              {t('webview.subtitle')}
            </p>
          </div>

          {/* How to open instructions */}
          <div className="p-4 border-2 border-main-text rounded-2xl bg-brand-light/50 space-y-3 shadow-[3px_3px_0px_#1A1A2E]">
            <h3 className="font-nunito font-black text-base text-main-text flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-accent-orange stroke-[2.5]" />
              {t('webview.instruction_title')}
            </h3>

            <div className="space-y-3 pt-1">
              {/* Step 1 */}
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 bg-white rounded-full border-2 border-main-text flex items-center justify-center font-nunito font-black text-xs text-accent-orange shrink-0 shadow-[1px_1px_0px_#1A1A2E] mt-0.5">
                  1
                </div>
                <p className="text-xs md:text-sm font-bold text-main-text leading-snug">
                  {t('webview.step_1')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 bg-white rounded-full border-2 border-main-text flex items-center justify-center font-nunito font-black text-xs text-accent-orange shrink-0 shadow-[1px_1px_0px_#1A1A2E] mt-0.5">
                  2
                </div>
                <p className="text-xs md:text-sm font-bold text-main-text leading-snug">
                  {t('webview.step_2')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2.5px_2.5px_0px_#1A1A2E] hover:bg-[#ff7b4b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all cursor-pointer"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
