import { useState } from 'react';
import { X, User as LucideUser, Link2, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member } from '../types';
import { useDialog } from '../contexts/DialogContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { useAuth } from '../contexts/AuthContext';
import { SponsorModal } from './SponsorModal';

interface ProfileModalProps {
  currentMember: Member;
  onClose: () => void;
  onSave: (data: Partial<Member>) => void;
  onDeleteAccount: () => void;
}

export function ProfileModal({
  currentMember,
  onClose,
  onSave,
  onDeleteAccount
}: ProfileModalProps) {
  useScrollLock();
  const { t } = useTranslation();
  const { confirm } = useDialog();
  const { user, googleLoading, deleteLoading, handleGoogleLogin } = useAuth();
  const [name, setName] = useState(currentMember.name || '');
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);

  const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com') || false;

  const handleLinkGoogleClick = async () => {
    await handleGoogleLogin();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim()
    });
  };

  const handleDeleteAccountClick = async () => {
    const isConfirmed = await confirm(t('auth.delete_account_msg'), {
      title: t('auth.delete_account'),
      confirmLabel: t('auth.delete_account_confirm'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      onDeleteAccount();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-50 flex items-end justify-center pt-16 sm:pt-20 px-0 pb-0 animate-in fade-in duration-200 select-none font-plus-jakarta"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md rounded-t-[24px] border-t-3 border-x-3 border-main-text shadow-[0_-12px_40px_rgba(26,26,46,0.15)] flex flex-col max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-nunito font-black text-main-text">{t('profile.title')}</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={deleteLoading} 
            className="text-main-text hover:text-accent-orange p-1.5 rounded-lg border-2 border-transparent hover:border-main-text hover:bg-white transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-grow">
          
          {/* Display Name Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase font-nunito tracking-wider text-main-text/60 mb-1.5">
                {t('profile.display_name')}
              </label>
              
              <div className="relative">
                <LucideUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-main-text/50 stroke-[2.5]" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('members.enter_name')}
                  disabled={deleteLoading}
                  className="w-full text-base font-bold text-main-text pl-11 pr-4 py-3 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none placeholder-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                  required
                  maxLength={30}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={deleteLoading}
              className="w-full py-3.5 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t('common.save')}
            </button>
          </div>

          {/* Google Linked Area */}
          <div className="pt-5 border-t-2 border-dashed border-main-text/10 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-black font-nunito text-main-text flex items-center gap-2">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              {t('profile.google_account')}
            </h3>

            {isGoogleLinked ? (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 bg-[#EAFAF3] text-[#0A7A4A] border border-[#0A7A4A]/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
              >
                <span className="w-1.5 h-1.5 bg-[#0A7A4A] rounded-full animate-pulse" />
                {t('profile.google_linked')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogleClick}
                disabled={googleLoading || deleteLoading}
                className="px-3.5 py-2 bg-white hover:bg-brand-light text-main-text border-2 border-main-text rounded-xl text-xs font-black font-nunito transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]"
              >
                {googleLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-orange" />
                ) : (
                  <Link2 className="w-3.5 h-3.5 text-accent-orange stroke-[2.5]" />
                )}
                {t('profile.link_google')}
              </button>
            )}
          </div>

          {/* Feedback Form Row */}
          <div className="pt-5 border-t-2 border-dashed border-main-text/10 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-black font-nunito text-main-text flex items-center gap-2">
              <span className="text-base">💬</span>
              {t('profile.feedback_title')}
            </h3>
            <a
              href="https://forms.gle/CWqJBPzSQ2TbTfgy7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-brand-light hover:bg-white text-accent-orange border-2 border-main-text rounded-xl text-xs font-black font-nunito transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]"
            >
              {t('profile.feedback_btn')}
            </a>
          </div>

          {/* Sponsor Row */}
          <div className="pt-5 border-t-2 border-dashed border-main-text/10 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-black font-nunito text-main-text flex items-center gap-2">
              <span className="text-base animate-pulse">💖</span>
              {t('profile.sponsor_title')}
            </h3>
            <button
              type="button"
              onClick={() => setIsSponsorOpen(true)}
              className="px-3.5 py-2 bg-accent-orange hover:bg-[#ff7b4b] text-white border-2 border-main-text rounded-xl text-xs font-black font-nunito transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]"
            >
              {t('profile.sponsor_btn')}
            </button>
          </div>

          {/* Delete Account Action */}
          <div className="space-y-3 pt-5 border-t-2 border-dashed border-main-text/10">
            <button
              type="button"
              onClick={handleDeleteAccountClick}
              disabled={deleteLoading}
              className="w-full py-3 bg-red-50 text-red-600 border-2 border-red-500 rounded-xl font-nunito font-black text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_rgba(239,68,68,0.1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
              )}
              {t('auth.delete_account')}
            </button>
          </div>
        </form>
      </div>
      {isSponsorOpen && <SponsorModal onClose={() => setIsSponsorOpen(false)} />}
    </div>
  );
}
