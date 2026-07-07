import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Languages, User as LucideUser, LayoutGrid, LogOut, Menu, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AppHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showProfile?: boolean;
  onProfileClick?: () => void;
  currentMemberName?: string;
  showGroups?: boolean;
}

export function AppHeader({
  showBack,
  onBack,
  showProfile,
  onProfileClick,
  currentMemberName,
  showGroups
}: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const { confirm, alert } = useDialog();
  const { platform: installPlatform, promptInstall } = usePWAInstall();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isZh = i18n.resolvedLanguage?.startsWith('zh');
  const nextLangLabel = isZh ? 'EN' : '中文';

  const toggleLanguage = () => {
    i18n.changeLanguage(isZh ? 'en' : 'zh-TW');
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleProfile = () => {
    setMenuOpen(false);
    onProfileClick?.();
  };

  const handleLanguage = () => {
    toggleLanguage();
    setMenuOpen(false);
  };

  const handleGroups = () => {
    setMenuOpen(false);
    navigate('/');
  };

  const handleInstall = async () => {
    setMenuOpen(false);
    if (installPlatform === 'native') {
      await promptInstall();
    } else if (installPlatform === 'ios') {
      await alert(`1. ${t('pwa.ios_step_1')}\n2. ${t('pwa.ios_step_2')}`, {
        title: t('pwa.ios_how'),
        confirmLabel: t('common.confirm'),
      });
    }
  };

  const handleLogoutClick = async () => {
    setMenuOpen(false);
    const isConfirmed = await confirm(t('auth.logout_msg'), {
      title: t('auth.logout'),
      confirmLabel: t('auth.logout'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      await handleLogout();
    }
  };

  return (
    <header className="bg-white border-b-3 border-main-text sticky top-0 z-30 shrink-0 select-none">
      <div className="w-full mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack || (() => navigate(-1))}
              className="p-2 -ml-1.5 text-main-text hover:text-accent-orange hover:bg-brand-light border-2 border-transparent hover:border-main-text rounded-xl transition-all duration-150 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer group"
            >
              {/* Mini Brand Sliced Logo */}
              <div className="w-[38px] h-[38px] bg-accent-orange text-white rounded-[12px] border-2 border-main-text flex items-center justify-center font-nunito font-black text-base relative rotate-[-4deg] group-hover:rotate-[4deg] transition-transform duration-200">
                <span className="scale-95 italic">S/</span>
              </div>
              <span className="font-nunito font-black text-2xl tracking-tight text-main-text">
                {APP_NAME}
              </span>
            </button>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t('common.settings')}
            className={`p-2 text-main-text border-2 rounded-xl transition-all duration-150 cursor-pointer ${
              menuOpen
                ? 'bg-brand-light border-main-text text-accent-orange'
                : 'border-transparent hover:text-accent-orange hover:bg-brand-light hover:border-main-text'
            }`}
          >
            <Menu className="w-6 h-6 stroke-[2.5]" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 bg-white border-3 border-main-text rounded-2xl shadow-[4px_4px_0px_#1A1A2E] overflow-hidden font-plus-jakarta animate-in fade-in zoom-in-95 duration-150 origin-top-right"
            >
              {showProfile && currentMemberName && (
                <button
                  role="menuitem"
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-main-text hover:bg-brand-light transition-colors cursor-pointer border-b-2 border-main-text/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-light border-2 border-main-text flex items-center justify-center shrink-0">
                    <LucideUser className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-main-text/50 leading-none mb-0.5">
                      {t('profile.title')}
                    </div>
                    <div className="text-sm font-black truncate">{currentMemberName}</div>
                  </div>
                </button>
              )}

              <button
                role="menuitem"
                onClick={handleLanguage}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-main-text hover:bg-brand-light transition-colors cursor-pointer border-b-2 border-main-text/10 last:border-b-0"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-light border-2 border-main-text flex items-center justify-center shrink-0">
                  <Languages className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black">{t('common.switch_lang')}</div>
                </div>
                <span className="text-xs font-black text-accent-orange bg-brand-light border-2 border-main-text rounded-full px-2 py-0.5">
                  {nextLangLabel}
                </span>
              </button>

              {installPlatform && (
                <button
                  role="menuitem"
                  onClick={handleInstall}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-main-text hover:bg-brand-light transition-colors cursor-pointer border-b-2 border-main-text/10 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-light border-2 border-main-text flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black">{t('pwa.install_menu')}</div>
                  </div>
                </button>
              )}

              {showGroups && (
                <button
                  role="menuitem"
                  onClick={handleGroups}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-main-text hover:bg-brand-light transition-colors cursor-pointer border-b-2 border-main-text/10 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-light border-2 border-main-text flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black">{t('groups.my_groups')}</div>
                  </div>
                </button>
              )}

              {user && (
                <button
                  role="menuitem"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-main-text hover:bg-brand-light transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-light border-2 border-main-text flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-accent-orange stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black">{t('auth.logout')}</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
