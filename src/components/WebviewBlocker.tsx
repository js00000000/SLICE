import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy, Check, Languages } from 'lucide-react';
import toast from 'react-hot-toast';

export function WebviewBlocker() {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.resolvedLanguage?.startsWith('zh') ? 'en' : 'zh-TW';
    i18n.changeLanguage(newLang);
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
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-6 font-plus-jakarta select-none selection:bg-brand-light relative">
      {/* Decorative blobs for a playful vibe */}
      <div className="absolute top-12 left-8 w-24 h-24 bg-brand-light rounded-full blur-2xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-16 right-8 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-[24px] border-3 border-main-text p-6 md:p-8 space-y-6 md:space-y-8 relative shadow-[8px_8px_0px_#1A1A2E]">
        
        {/* Header Warning Icon */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="relative w-16 h-16 bg-accent-orange text-white rounded-[20px] border-3 border-main-text flex items-center justify-center mx-auto shadow-[4px_4px_0px_#1A1A2E] rotate-[-4deg]">
              <AlertTriangle className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-nunito font-black text-main-text leading-tight tracking-tight mt-2">
              {t('webview.title')}
            </h1>
            <p className="text-gray-500 font-semibold text-sm md:text-base px-2">
              {t('webview.subtitle')}
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions Panel */}
        <div className="bg-brand-light/40 border-3 border-main-text rounded-[20px] p-4 md:p-5 space-y-4 shadow-[4px_4px_0px_#1A1A2E]">
          <h2 className="font-nunito font-black text-lg text-main-text border-b-2 border-dashed border-main-text/20 pb-2 flex items-center gap-2">
            <span className="text-accent-orange text-xl">✨</span> {t('webview.instruction_title')}
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-white rounded-full border-2 border-main-text flex items-center justify-center font-nunito font-black text-accent-orange shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
                1
              </div>
              <p className="text-sm md:text-base font-bold text-main-text leading-snug pt-0.5">
                {t('webview.step_1')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-white rounded-full border-2 border-main-text flex items-center justify-center font-nunito font-black text-accent-orange shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
                2
              </div>
              <p className="text-sm md:text-base font-bold text-main-text leading-snug pt-0.5">
                {t('webview.step_2')}
              </p>
            </div>
          </div>
        </div>

        {/* Copy Link Button & Language Switcher */}
        <div className="space-y-4 pt-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-accent-orange text-white border-3 border-main-text rounded-[16px] font-nunito font-black text-lg hover:bg-[#ff7b4b] shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
          >
            {copied ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <Copy className="w-5 h-5 stroke-[2.5]" />
            )}
            {t('webview.copy_btn')}
          </button>

          <div className="pt-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-sm font-bold text-accent-orange bg-brand-light px-4 py-2 rounded-full border-2 border-main-text hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Languages className="w-4 h-4" />
              {i18n.resolvedLanguage?.startsWith('zh') ? 'English' : '繁體中文'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
