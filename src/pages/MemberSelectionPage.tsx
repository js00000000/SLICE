import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { AppHeader } from '../components/AppHeader';
import { APP_NAME } from '../constants';

export function MemberSelectionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { members, handleSelectMember, handleCreateMember } = useGroup();
  const [newName, setNewName] = useState('');

  // Manual title fallback
  useEffect(() => {
    document.title = `${t('members.select_identity')} - ${APP_NAME}`;
  }, [t]);

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta flex flex-col pb-10">
      <Helmet>
        <title>{t('members.select_identity')} - {APP_NAME}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AppHeader
        showBack
        onBack={() => navigate('/')}
      />

      <div className="w-full max-w-md mx-auto p-5 py-6 space-y-6 flex-1 flex flex-col justify-start">
        
        {/* Page title */}
        <div className="stagger-item text-center space-y-1 py-2" style={{ animationDelay: '0ms' }}>
          <h1 className="text-3xl font-nunito font-black text-main-text leading-tight tracking-tight">
            {t('members.select_identity') || 'Who are you?'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {t('members.select_identity_subtitle') || 'Select your identity to continue splitting'}
          </p>
        </div>

        {/* Content Box */}
        <div className="stagger-item bg-white rounded-[24px] border-3 border-main-text p-6 shadow-[4px_4px_0px_#1A1A2E] space-y-6" style={{ animationDelay: '60ms' }}>
          
          {members.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b-2 border-dashed border-main-text/10 pb-2">
                <Users className="w-4.5 h-4.5 text-accent-orange stroke-[2.5]" />
                <h2 className="font-nunito font-black text-sm text-main-text uppercase tracking-wider">
                  {t('members.select_existing') || 'Choose Existing Member'}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {members.map(m => {
                  const isClaimedByOthers = m.userId && m.userId !== user?.uid;
                  const isMe = m.userId === user?.uid;
                  
                  return (
                    <button 
                      key={m.id} 
                      onClick={() => !isClaimedByOthers && handleSelectMember(m.id)}
                      disabled={!!isClaimedByOthers}
                      className={`p-3.5 border-2 rounded-xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-20 ${
                        isMe 
                          ? 'border-main-text bg-brand-light text-main-text shadow-[2px_2px_0px_#1A1A2E]' 
                          : isClaimedByOthers 
                            ? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed' 
                            : 'border-gray-200 text-gray-600 hover:border-main-text hover:bg-page-bg shadow-[2px_2px_0px_#f0f0f0] hover:shadow-[2px_2px_0px_#1A1A2E]'
                      }`}
                    >
                      <div className="font-nunito font-black text-base text-main-text truncate flex items-center gap-1.5 w-full">
                        <span className="truncate">{m.name}</span>
                        {isMe && <CheckCircle2 className="w-4 h-4 text-accent-orange stroke-[3] shrink-0" />}
                      </div>
                      <div className="text-[10px] font-black tracking-wider uppercase text-main-text/50">
                        {isMe ? t('members.you') : isClaimedByOthers ? t('members.claimed') : t('members.not_claimed')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-center py-1">
            <div className="flex-grow border-t-2 border-dashed border-gray-100"></div>
            <span className="flex-shrink mx-3 text-[10px] font-black text-gray-300 font-nunito uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t-2 border-dashed border-gray-100"></div>
          </div>

          {/* Create Member Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleCreateMember(newName); }}
            className="space-y-3"
          >
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-4.5 h-4.5 text-accent-orange stroke-[2.5]" />
              <h2 className="font-nunito font-black text-sm text-main-text uppercase tracking-wider">{t('members.or_create')}:</h2>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('profile.display_name')}
                className="flex-1 px-4 py-2.5 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white"
                required
              />
              <button 
                type="submit" 
                disabled={!newName.trim()}
                className="px-5 py-2.5 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer whitespace-nowrap"
              >
                {t('common.confirm')}
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
