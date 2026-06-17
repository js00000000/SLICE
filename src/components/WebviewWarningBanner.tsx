import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface WebviewWarningBannerProps {
  onDismiss: () => void;
}

export function WebviewWarningBanner({ onDismiss }: WebviewWarningBannerProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDismiss = () => {
    sessionStorage.setItem('webview-warning-dismissed', 'true');
    onDismiss();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t('webview.copied_toast'), {
        style: {
          border: '3px solid #1A1A2E',
          padding: '12px 16px',
          color: '#1A1A2E',
          fontWeight: '700',
          fontFamily: 'Plus Jakarta Sans',
          borderRadius: '16px',
          background: '#FFF0EA',
          boxShadow: '4px 4px 0px #1A1A2E',
        },
        iconTheme: {
          primary: '#FF6B35',
          secondary: '#FFF',
        }
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full bg-brand-light border-b-3 border-main-text text-main-text font-plus-jakarta relative z-50 shadow-sm animate-fadeIn">
      <div className="max-w-[480px] mx-auto p-4 flex flex-col gap-3">
        {/* Row 1: Header Info & Dismiss */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 bg-accent-orange text-white rounded-lg border-2 border-main-text flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#1A1A2E] mt-0.5 animate-bounce">
              <AlertTriangle className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-nunito font-black text-sm md:text-base leading-tight flex items-center gap-1.5">
                {t('webview.title')}
              </h4>
              <p className="text-xs md:text-sm font-semibold text-gray-600 leading-snug">
                {t('webview.subtitle')}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/50 rounded-full transition-colors shrink-0 text-gray-500 hover:text-main-text cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Row 2: Guide Toggle Link */}
        <div className="flex justify-between items-center pl-10.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-black text-accent-orange hover:text-[#ff7b4b] cursor-pointer"
          >
            <span>{t('webview.instruction_title')}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Steps Guide */}
        {expanded && (
          <div className="mt-1 bg-white/70 border-2 border-dashed border-main-text/20 rounded-xl p-3 space-y-3 shadow-inner ml-10.5">
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 bg-white rounded-full border border-main-text flex items-center justify-center font-nunito font-black text-xs text-accent-orange shrink-0 shadow-[1px_1px_0px_#1A1A2E]">
                  1
                </div>
                <p className="text-xs font-bold text-main-text leading-snug pt-0.5">
                  {t('webview.step_1')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 bg-white rounded-full border border-main-text flex items-center justify-center font-nunito font-black text-xs text-accent-orange shrink-0 shadow-[1px_1px_0px_#1A1A2E]">
                  2
                </div>
                <p className="text-xs font-bold text-main-text leading-snug pt-0.5">
                  {t('webview.step_2')}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <div className="pt-1 flex justify-end">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-orange text-white border-2 border-main-text rounded-lg text-xs font-bold hover:bg-[#ff7b4b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0px_0px_0px_#1A1A2E] shadow-[1.5px_1.5px_0px_#1A1A2E] transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                {t('webview.copy_btn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
