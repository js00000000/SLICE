import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollLock } from '../hooks/useScrollLock';

interface AbandonGuestConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function AbandonGuestConfirmationModal({ onClose, onConfirm }: AbandonGuestConfirmationModalProps) {
  useScrollLock();
  const { t, i18n } = useTranslation();

  return (
    <div className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-[100] flex items-center justify-center p-5 select-none font-plus-jakarta animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[24px] border-3 border-main-text shadow-[6px_6px_0px_#1A1A2E] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <h2 className="text-xl font-nunito font-black text-main-text">{t('auth.account_exists')}</h2>
          <button 
            onClick={onClose} 
            className="text-main-text hover:text-accent-orange p-1.5 rounded-lg border-2 border-transparent hover:border-main-text hover:bg-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          
          {/* Tilted warning badge with nice borders & shadow */}
          <div className="w-14 h-14 bg-amber-50 text-amber-500 border-2 border-main-text rounded-2xl flex items-center justify-center mx-auto rotate-[-6deg] shadow-[2px_2px_0px_#1A1A2E]">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-nunito font-black text-main-text leading-tight">
              {i18n.resolvedLanguage?.startsWith('zh') ? '此 Google 帳號已在其他裝置使用過' : 'This Google account is already in use'}
            </h3>
            <p className="text-gray-500 font-medium text-sm leading-relaxed">
              {t('auth.abandon_guest_msg')}
            </p>
          </div>

          {/* Action buttons with bouncy click states */}
          <div className="space-y-3 pt-3 border-t-2 border-dashed border-main-text/10">
            <button
              onClick={onConfirm}
              className="w-full py-3.5 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer"
            >
              {t('auth.abandon_confirm')}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
