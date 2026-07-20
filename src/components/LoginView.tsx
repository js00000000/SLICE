import { UserCircle, Languages, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../constants';

interface LoginViewProps {
  onGoogleLogin: () => void;
  onLineLogin: () => void;
  onGuestLogin: () => void;
  onQuickStart: () => void;
  showQuickStart?: boolean;
  isGoogleLoading?: boolean;
  isLineLoading?: boolean;
  isGuestLoading?: boolean;
}

export function LoginView({ 
  onGoogleLogin, 
  onLineLogin,
  onGuestLogin,
  onQuickStart,
  showQuickStart = false,
  isGoogleLoading = false,
  isLineLoading = false,
  isGuestLoading = false
}: LoginViewProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.resolvedLanguage?.startsWith('zh') ? 'en' : 'zh-TW';
    i18n.changeLanguage(newLang);
  };

  const isAnyLoading = isGoogleLoading || isLineLoading || isGuestLoading;

  return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-6 font-plus-jakarta selection:bg-brand-light">
      {/* Decorative Floating Blobs for a Playful Duolingo Vibe */}
      <div className="absolute top-12 left-8 w-24 h-24 bg-brand-light rounded-full blur-2xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-16 right-8 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-[24px] border-3 border-main-text p-8 space-y-8 relative shadow-[8px_8px_0px_#1A1A2E] transform transition-transform duration-300">
        
        {/* App Title & Sliced Brand Logo */}
        <div className="text-center space-y-4">
          <div className="relative inline-block select-none">
            {/* Logo container with physical slice appearance */}
            <div className="relative w-20 h-20 bg-accent-orange text-white rounded-[20px] border-3 border-main-text flex items-center justify-center mx-auto shadow-[4px_4px_0px_#1A1A2E] rotate-[-3deg] hover:rotate-[3deg] transition-transform duration-300 cursor-pointer group">
              {/* Sliced Line Diagonal Overlay */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-[16px]">
                <div className="absolute top-[-20%] left-[45%] w-[8%] h-[150%] bg-white/30 rotate-[45deg] transition-transform duration-500 group-hover:scale-y-110" />
              </div>
              
              {/* Triangular Wavy Accent representing a SLICE */}
              <span className="font-nunito font-black text-4xl tracking-tighter italic scale-95 flex items-center">
                S<span className="text-brand-light">/</span>
              </span>
            </div>
            
            {/* Mini cute brand tag */}
            <span className="absolute -top-3 -right-6 bg-main-text text-brand-light text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_#FF6B35]">
              {APP_NAME}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3.5xl font-nunito font-black text-main-text leading-tight tracking-tight mt-2">
              {t('auth.login_title')}
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              {t('auth.login_subtitle')}
            </p>
          </div>
        </div>

        {/* Action Buttons with 3D Tactile Borders (Duolingo Style) */}
        <div className="space-y-3 pt-2">
          
          {/* Google Login - Clean & High Contrast */}
          <button
            onClick={onGoogleLogin}
            disabled={isAnyLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-3 border-main-text rounded-[16px] font-nunito font-black text-main-text hover:bg-brand-light shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-accent-orange" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            )}
            {t('auth.google_login')}
          </button>

          {/* LINE Login - High Impact Green Brand Accent */}
          <button
            onClick={onLineLogin}
            disabled={isAnyLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#06C755] text-white border-3 border-main-text rounded-[16px] font-nunito font-black text-main-text hover:bg-[#05b34c] shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {isLineLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.412-.09-.544-.254l-2.047-2.63v2.257c0 .348-.283.63-.63.63-.347 0-.63-.282-.63-.63V8.108c0-.27.173-.51.43-.595.065-.022.134-.032.201-.032.21 0 .41.09.542.254l2.047 2.63V8.108c0-.345.282-.63.63-.63.348 0 .631.285.631.63v4.771zm-6.641 0c0 .348-.283.63-.63.63-.347 0-.63-.282-.63-.63V8.108c0-.345.283-.63.63-.63.347 0 .63.285.63.63v4.771zm-2.507 0h-2.388c-.347 0-.629-.285-.629-.63V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.141h1.759c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08-.085.643-.388 2.508-.424 3.04-.055.795.367.781.77.525 3.013-1.914 8.125-5.368 11.087-9.191C23.593 14.54 24 12.519 24 10.314" />
              </svg>
            )}
            {t('auth.line_login')}
          </button>

          {/* Sliced divider */}
          <div className="relative flex py-1.5 items-center justify-center">
            <div className="flex-grow border-t-2 border-dashed border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-black text-gray-400 font-nunito tracking-widest uppercase">
              {t('common.or') || 'OR'}
            </span>
            <div className="flex-grow border-t-2 border-dashed border-gray-200"></div>
          </div>

          {/* Quick Start / Guest Login - Playful Accent Orange */}
          <button
            onClick={showQuickStart ? onQuickStart : onGuestLogin}
            disabled={isAnyLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-accent-orange text-white border-3 border-main-text rounded-[16px] font-nunito font-black text-lg hover:bg-[#ff7b4b] shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {isGuestLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
            {t(showQuickStart ? 'auth.quick_start' : 'auth.guest_login')}
          </button>

          {/* Bottom language select button */}
          <div className="pt-6 border-t border-gray-100 flex justify-center">
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
