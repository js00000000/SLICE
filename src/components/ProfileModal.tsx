import { useState } from 'react';
import { X, User as LucideUser, Link2, Unlink, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member } from '../types';
import { useDialog } from '../contexts/DialogContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { useAuth } from '../contexts/AuthContext';
import { LINE_PROVIDER_ID } from '../lib/firebase';
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
  const {
    user, googleLoading, lineLoading, deleteLoading,
    handleGoogleLogin, handleLineLogin, handleUnlinkGoogle, handleUnlinkLine
  } = useAuth();
  const [name, setName] = useState(currentMember.name || '');
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);

  const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com') || false;
  const isLineLinked = user?.providerData.some(p => p.providerId === LINE_PROVIDER_ID || p.providerId.includes('line')) || false;
  const totalLinkedProviders = user?.providerData.length || 0;
  const canUnlink = totalLinkedProviders >= 2;

  const handleLinkGoogleClick = async () => {
    await handleGoogleLogin();
  };

  const handleLinkLineClick = async () => {
    await handleLineLogin();
  };

  const handleUnlinkGoogleClick = async () => {
    const isConfirmed = await confirm(t('profile.google_unlink_confirm'), {
      title: t('profile.unlink_google'),
      confirmLabel: t('profile.unlink_google'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      await handleUnlinkGoogle();
    }
  };

  const handleUnlinkLineClick = async () => {
    const isConfirmed = await confirm(t('profile.line_unlink_confirm'), {
      title: t('profile.unlink_line'),
      confirmLabel: t('profile.unlink_line'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      await handleUnlinkLine();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim().slice(0, 20)
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
                  maxLength={20}
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
              canUnlink ? (
                <button
                  type="button"
                  onClick={handleUnlinkGoogleClick}
                  disabled={googleLoading || lineLoading || deleteLoading}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-500 rounded-xl text-xs font-black font-nunito transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_rgba(239,68,68,0.2)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {googleLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  {t('profile.unlink_google')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 bg-[#EAFAF3] text-[#0A7A4A] border border-[#0A7A4A]/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A7A4A] rounded-full animate-pulse" />
                  {t('profile.google_linked')}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogleClick}
                disabled={googleLoading || lineLoading || deleteLoading}
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

          {/* LINE Linked Area */}
          <div className="pt-5 border-t-2 border-dashed border-main-text/10 flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-black font-nunito text-main-text flex items-center gap-2">
              <svg className="w-4 h-4 fill-[#06C755]" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.412-.09-.544-.254l-2.047-2.63v2.257c0 .348-.283.63-.63.63-.347 0-.63-.282-.63-.63V8.108c0-.27.173-.51.43-.595.065-.022.134-.032.201-.032.21 0 .41.09.542.254l2.047 2.63V8.108c0-.345.282-.63.63-.63.348 0 .631.285.631.63v4.771zm-6.641 0c0 .348-.283.63-.63.63-.347 0-.63-.282-.63-.63V8.108c0-.345.283-.63.63-.63.347 0 .63.285.63.63v4.771zm-2.507 0h-2.388c-.347 0-.629-.285-.629-.63V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.141h1.759c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08-.085.643-.388 2.508-.424 3.04-.055.795.367.781.77.525 3.013-1.914 8.125-5.368 11.087-9.191C23.593 14.54 24 12.519 24 10.314" />
              </svg>
              {t('profile.line_account')}
            </h3>

            {isLineLinked ? (
              canUnlink ? (
                <button
                  type="button"
                  onClick={handleUnlinkLineClick}
                  disabled={googleLoading || lineLoading || deleteLoading}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-500 rounded-xl text-xs font-black font-nunito transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_rgba(239,68,68,0.2)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {lineLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  {t('profile.unlink_line')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 bg-[#EAFAF3] text-[#0A7A4A] border border-[#0A7A4A]/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A7A4A] rounded-full animate-pulse" />
                  {t('profile.line_linked')}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleLinkLineClick}
                disabled={googleLoading || lineLoading || deleteLoading}
                className="px-3.5 py-2 bg-white hover:bg-brand-light text-main-text border-2 border-main-text rounded-xl text-xs font-black font-nunito transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]"
              >
                {lineLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#06C755]" />
                ) : (
                  <Link2 className="w-3.5 h-3.5 text-[#06C755] stroke-[2.5]" />
                )}
                {t('profile.link_line')}
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
