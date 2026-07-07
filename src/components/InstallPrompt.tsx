import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, X, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallPrompt() {
  const { t } = useTranslation();
  const { platform, promptInstall, dismiss } = usePWAInstall();
  const [expanded, setExpanded] = useState(false);

  if (!platform) return null;

  return (
    <div className="fixed-in-container bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+92px)]">
      <div className="bg-white border-2 border-main-text rounded-2xl shadow-[4px_4px_0px_#1A1A2E] p-4 font-plus-jakarta animate-fadeIn">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 bg-accent-orange text-white rounded-lg border-2 border-main-text flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#1A1A2E] mt-0.5">
              <Smartphone className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-nunito font-black text-sm leading-tight text-main-text">
                {t('pwa.install_title')}
              </h4>
              <p className="text-xs font-semibold text-gray-600 leading-snug">
                {t('pwa.install_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="p-1 hover:bg-brand-light rounded-full transition-colors shrink-0 text-gray-500 hover:text-main-text cursor-pointer"
            aria-label={t('pwa.dismiss')}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {platform === 'native' ? (
          <div className="mt-3 flex justify-end">
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-orange text-white border-2 border-main-text rounded-xl text-sm font-nunito font-black shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              {t('pwa.install_btn')}
            </button>
          </div>
        ) : (
          <div className="mt-2 pl-10.5">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-black text-accent-orange hover:text-[#ff7b4b] cursor-pointer"
            >
              <span>{t('pwa.ios_how')}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expanded && (
              <div className="mt-2 bg-brand-light/60 border-2 border-dashed border-main-text/20 rounded-xl p-3 space-y-2.5">
                {(['pwa.ios_step_1', 'pwa.ios_step_2'] as const).map((key, i) => (
                  <div key={key} className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 bg-white rounded-full border border-main-text flex items-center justify-center font-nunito font-black text-xs text-accent-orange shrink-0 shadow-[1px_1px_0px_#1A1A2E]">
                      {i + 1}
                    </div>
                    <p className="text-xs font-bold text-main-text leading-snug pt-0.5">
                      {t(key)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
