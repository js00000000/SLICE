import { UserCircle, Languages, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../constants';

interface LoginViewProps {
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
  onQuickStart: () => void;
  showQuickStart?: boolean;
  isGoogleLoading?: boolean;
  isGuestLoading?: boolean;
}

export function LoginView({ 
  onGoogleLogin, 
  onGuestLogin,
  onQuickStart,
  showQuickStart = false,
  isGoogleLoading = false,
  isGuestLoading = false
}: LoginViewProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh-TW';
    i18n.changeLanguage(newLang);
  };

  const isAnyLoading = isGoogleLoading || isGuestLoading;

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
        <div className="space-y-4 pt-2">
          
          {/* Google Login - Clean & High Contrast */}
          <button
            onClick={onGoogleLogin}
            disabled={isAnyLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-3 border-main-text rounded-[16px] font-nunito font-black text-main-text hover:bg-brand-light shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-accent-orange" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            )}
            {t('auth.google_login')}
          </button>

          {/* Sliced divider */}
          <div className="relative flex py-2 items-center justify-center">
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
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-accent-orange text-white border-3 border-main-text rounded-[16px] font-nunito font-black text-lg hover:bg-[#ff7b4b] shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
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
              {i18n.language.startsWith('zh') ? 'English' : '繁體中文'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
