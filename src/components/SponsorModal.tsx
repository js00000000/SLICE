import { useEffect } from 'react';
import { X, CreditCard, Mail, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollLock } from '../hooks/useScrollLock';

interface SponsorModalProps {
  onClose: () => void;
}

export function SponsorModal({ onClose }: SponsorModalProps) {
  useScrollLock();
  const { t } = useTranslation();

  // Close on Escape for keyboard/a11y parity with the backdrop click.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-plus-jakarta">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sponsor-modal-title"
        className="bg-white w-full max-w-md rounded-[24px] border-3 border-main-text shadow-[8px_8px_0px_#1A1A2E] z-10 flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent-orange fill-accent-orange/10 animate-pulse" />
            <h2 id="sponsor-modal-title" className="text-2xl font-nunito font-black text-main-text">{t('sponsor.title')}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-main-text hover:text-accent-orange p-1.5 rounded-lg border-2 border-transparent hover:border-main-text hover:bg-white transition-all cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Main Info Box */}
          <div className="p-4 border-2 border-main-text rounded-xl bg-page-bg/40 space-y-3 shadow-[2px_2px_0px_#1A1A2E]">
            <p className="text-sm font-semibold text-main-text leading-relaxed">
              {t('sponsor.desc_1')}
            </p>
            <p className="text-sm font-black text-accent-orange flex items-center gap-1.5">
              <span className="animate-bounce">🍕</span>
              {t('sponsor.desc_2')}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            {/* ECPay Option */}
            <div className="p-4 border-2 border-main-text rounded-xl bg-white space-y-3 shadow-[3px_3px_0px_#1A1A2E]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent-orange stroke-[2.5]" />
                <h4 className="font-nunito font-black text-base text-main-text">
                  {t('sponsor.ecpay_title')}
                </h4>
              </div>
              <p className="text-xs text-gray-500 font-bold leading-relaxed pl-1">
                {t('sponsor.ecpay_desc')}
              </p>
              <a
                href="https://p.ecpay.com.tw/5F247ED"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] hover:bg-[#ff7b4b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all duration-150 no-underline cursor-pointer"
              >
                {t('sponsor.ecpay_btn')}
              </a>
            </div>

            {/* Buy Me a Coffee / Pizza Option */}
            <div className="p-4 border-2 border-main-text rounded-xl bg-white space-y-3 shadow-[3px_3px_0px_#1A1A2E] flex flex-col items-start w-full">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍕</span>
                <h4 className="font-nunito font-black text-base text-main-text">
                  {t('sponsor.bmc_title')}
                </h4>
              </div>
              <p className="text-xs text-gray-500 font-bold leading-relaxed pl-1">
                {t('sponsor.bmc_desc')}
              </p>
              <div className="w-full pt-1 flex justify-center">
                <a
                  href="https://www.buymeacoffee.com/fusion.labs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#FFDD00] text-black rounded-xl border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] hover:bg-[#ffea30] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all duration-150 no-underline cursor-pointer"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <span className="text-xl">🍕</span>
                  <span className="text-sm font-black tracking-wide">Buy me a pizza</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact & Disclaimer */}
          <div className="pt-4 border-t-2 border-dashed border-main-text/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-main-text/70 pl-1">
              <Mail className="w-4 h-4 text-accent-orange stroke-[2.5]" />
              <span>fusion.labs.tw@gmail.com</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed pl-1">
              {t('sponsor.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
