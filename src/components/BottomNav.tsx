import { useState, useEffect } from 'react';
import { LayoutDashboard, DollarSign, Plus, Receipt, Users, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGroup } from '../contexts/GroupContext';
import { ExpenseModal } from './ExpenseModal';

export type TabType = 'expenses' | 'settlements' | 'members' | 'dashboard';

interface BottomNavProps {
  activeTab: TabType;
  groupId?: string;
  onAddClick?: () => void;
}

export function BottomNav({ activeTab, groupId: propGroupId, onAddClick }: BottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    groupId: contextGroupId, 
    isSettled,
    members,
    currentMemberId,
    handleAddExpense
  } = useGroup();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const groupId = propGroupId || contextGroupId;
  const addDisabled = !groupId || isSettled;

  // Use sessionStorage to persist the active tab position for smooth cross-page transition
  const [displayTab, setDisplayTab] = useState<TabType>(() => {
    const prevTab = sessionStorage.getItem('slice-last-tab') as TabType;
    const validTabs: TabType[] = ['expenses', 'settlements', 'members', 'dashboard'];
    if (prevTab && prevTab !== activeTab && validTabs.includes(prevTab)) {
      return prevTab;
    }
    return activeTab;
  });

  useEffect(() => {
    // Save the activeTab so the next page knows where we navigated from
    sessionStorage.setItem('slice-last-tab', activeTab);

    // If displayTab is different from current activeTab, animate to it
    if (displayTab !== activeTab) {
      const timer = setTimeout(() => {
        setDisplayTab(activeTab);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, displayTab]);

  const handleTabClick = (tab: TabType) => {
    if (!groupId) return;

    // Immediately save the activeTab before navigating so the target page knows the origin
    sessionStorage.setItem('slice-last-tab', activeTab);

    if (tab === 'dashboard') {
      navigate(`/group/${groupId}`);
      return;
    }

    if (tab === 'members') {
      navigate(`/group/${groupId}/members`);
      return;
    }

    if (tab === 'expenses') {
      navigate(`/group/${groupId}/expenses`);
      return;
    }

    if (tab === 'settlements') {
      navigate(`/group/${groupId}/settlements`);
      return;
    }
  };

  const handleAddClick = () => {
    if (!groupId) return;
    if (isSettled) {
      toast.error(t('settle.locked_msg'));
      return;
    }
    if (onAddClick) {
      onAddClick();
    } else {
      setIsAddModalOpen(true);
    }
  };

  // Pre-calculate positions for the sliding active indicator using exact grid col percentages
  const activeLefts: Record<TabType, string> = {
    dashboard: '0%',
    settlements: '20%',
    expenses: '60%',
    members: '80%',
  };

  const activeLeft = activeLefts[displayTab];

  return (
    <>
      <div className="fixed-in-container bottom-0 z-20 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2 select-none w-full max-w-[480px] pointer-events-none">
        <div className="relative bg-white/70 backdrop-blur-xl border-3 border-main-text shadow-[0_8px_32px_rgba(26,26,46,0.12),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(26,26,46,0.05),4px_4px_0px_#1A1A2E] px-0 py-2.5 grid grid-cols-5 items-center rounded-[30px] overflow-visible">
          
          {/* Glass reflection gloss overlay */}
          <div className="absolute inset-0 rounded-[27px] bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none z-0" />
          
          {/* Sliding glass active indicator */}
          {groupId && activeLeft !== undefined && (
            <div 
              className="absolute top-1.5 bottom-1.5 transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1.1) z-0 pointer-events-none"
              style={{
                left: activeLeft,
                width: '20%'
              }}
            >
              <div className="mx-1.5 h-full rounded-[22px] bg-brand-light/95 border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E]" />
            </div>
          )}

          {/* Dashboard */}
          <button
            onClick={() => handleTabClick('dashboard')}
            disabled={!groupId}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 p-2 h-12 transition-all duration-150 btn-bounce cursor-pointer active:scale-90 ${
              !groupId ? 'opacity-30 cursor-not-allowed' :
              activeTab === 'dashboard' 
                ? 'text-accent-orange scale-105' 
                : 'text-gray-500 hover:text-main-text'
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5 stroke-[2.5]" />
            <span className="text-[10px] font-black tracking-tight truncate w-full text-center font-display">{t('common.dashboard')}</span>
            <span className={`absolute bottom-0 w-2.5 h-1 bg-accent-orange rounded-full transition-all duration-300 ${
              activeTab === 'dashboard' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`} />
          </button>

          {/* Settlements */}
          <button
            onClick={() => handleTabClick('settlements')}
            disabled={!groupId}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 p-2 h-12 transition-all duration-150 btn-bounce cursor-pointer active:scale-90 ${
              !groupId ? 'opacity-30 cursor-not-allowed' : 
              activeTab === 'settlements' 
                ? 'text-accent-orange scale-105' 
                : 'text-gray-500 hover:text-main-text'
            }`}
          >
            <DollarSign className="w-5.5 h-5.5 stroke-[2.5]" />
            <span className="text-[10px] font-black tracking-tight truncate w-full text-center font-display">{t('balances.title')}</span>
            <span className={`absolute bottom-0 w-2.5 h-1 bg-accent-orange rounded-full transition-all duration-300 ${
              activeTab === 'settlements' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`} />
          </button>

          {/* Playful Float Add Button */}
          <div className="relative z-20 flex justify-center">
            <button
              onClick={handleAddClick}
              disabled={addDisabled}
              title={isSettled ? t('settle.locked_msg') : undefined}
              className={`flex flex-col items-center -mt-9 p-3.5 rounded-[22px] border-3 border-main-text shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-1px_2px_rgba(0,0,0,0.15),4px_4px_0px_#1A1A2E] transition-all duration-150 cursor-pointer ${
                addDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed grayscale shadow-none' 
                  : 'bg-accent-orange text-white hover:bg-[#ff7b4b] hover:scale-105 active:scale-90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E]'
              }`}
            >
              {isSettled ? <Lock className="w-7 h-7 stroke-[3]" /> : <Plus className="w-7 h-7 stroke-[3]" />}
            </button>
          </div>

          {/* Expenses List */}
          <button
            onClick={() => handleTabClick('expenses')}
            disabled={!groupId}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 p-2 h-12 transition-all duration-150 btn-bounce cursor-pointer active:scale-90 ${
              !groupId ? 'opacity-30 cursor-not-allowed' :
              activeTab === 'expenses' 
                ? 'text-accent-orange scale-105' 
                : 'text-gray-500 hover:text-main-text'
            }`}
          >
            <Receipt className="w-5.5 h-5.5 stroke-[2.5]" />
            <span className="text-[10px] font-black tracking-tight truncate w-full text-center font-display">{t('expenses.title')}</span>
            <span className={`absolute bottom-0 w-2.5 h-1 bg-accent-orange rounded-full transition-all duration-300 ${
              activeTab === 'expenses' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`} />
          </button>

          {/* Settings */}
          <button
            onClick={() => handleTabClick('members')}
            disabled={!groupId}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 p-2 h-12 transition-all duration-150 btn-bounce cursor-pointer active:scale-90 ${
              !groupId ? 'opacity-30 cursor-not-allowed' :
              activeTab === 'members' 
                ? 'text-accent-orange scale-105' 
                : 'text-gray-500 hover:text-main-text'
            }`}
          >
            <Users className="w-5.5 h-5.5 stroke-[2.5]" />
            <span className="text-[10px] font-black tracking-tight truncate w-full text-center font-display">{t('common.settings')}</span>
            <span className={`absolute bottom-0 w-2.5 h-1 bg-accent-orange rounded-full transition-all duration-300 ${
              activeTab === 'members' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`} />
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <ExpenseModal
          members={members}
          currentMemberId={currentMemberId!}
          initialData={null}
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (data) => {
            await handleAddExpense(data);
            toast.success(t('expenses.added'));
            setIsAddModalOpen(false);
          }}
        />
      )}
    </>
  );
}