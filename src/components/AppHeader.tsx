import { ArrowLeft, Languages, User as LucideUser, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';

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

  const toggleLanguage = () => {
    const newLang = i18n.resolvedLanguage?.startsWith('zh') ? 'en' : 'zh-TW';
    i18n.changeLanguage(newLang);
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
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group"
            >
              {/* Mini Brand Sliced Logo */}
              <div className="w-8 h-8 bg-accent-orange text-white rounded-[10px] border-2 border-main-text flex items-center justify-center font-nunito font-black text-sm relative rotate-[-4deg] group-hover:rotate-[4deg] transition-transform duration-200">
                <span className="scale-95 italic">S/</span>
              </div>
              <span className="font-nunito font-black text-xl tracking-tight text-main-text">
                {APP_NAME}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showProfile && currentMemberName && (
            <button
              onClick={onProfileClick}
              className="flex items-center gap-1.5 text-xs font-bold text-main-text bg-brand-light px-3 py-1.5 rounded-full border-2 border-main-text hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title={t('profile.title')}
            >
              <LucideUser className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="max-w-[80px] truncate">{currentMemberName}</span>
            </button>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2 text-main-text hover:text-accent-orange hover:bg-brand-light border-2 border-transparent hover:border-main-text rounded-xl transition-all duration-150 cursor-pointer"
            title={t('common.switch_lang')}
          >
            <Languages className="w-4 h-4 stroke-[2]" />
          </button>

          {showGroups && (
            <button
              onClick={() => navigate('/')}
              className="p-2 text-main-text hover:text-accent-orange hover:bg-brand-light border-2 border-transparent hover:border-main-text rounded-xl transition-all duration-150 cursor-pointer"
              title={t('groups.my_groups')}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
