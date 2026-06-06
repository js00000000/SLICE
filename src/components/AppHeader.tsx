import { ArrowLeft, Languages, User as LucideUser, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';

interface AppHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  showProfile?: boolean;
  onProfileClick?: () => void;
  currentMemberName?: string;
}

export function AppHeader({
  showBack,
  onBack,
  showProfile,
  onProfileClick,
  currentMemberName
}: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh-TW';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="w-full mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack || (() => navigate(-1))}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer text-indigo-600"
            >
              <Receipt className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black tracking-tighter uppercase text-indigo-400 leading-none">
              {APP_NAME}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showProfile && currentMemberName && (
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              title={t('profile.title')}
            >
              <LucideUser className="w-4 h-4" />
              <span className="max-w-[80px] truncate hidden xs:inline">{currentMemberName}</span>
            </button>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title={t('common.switch_lang')}
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
