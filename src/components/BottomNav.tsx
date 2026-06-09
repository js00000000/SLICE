import { LayoutGrid, DollarSign, Plus, Receipt, Users, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGroup } from '../contexts/GroupContext';

export type TabType = 'expenses' | 'settlements' | 'members' | 'dashboard';

interface BottomNavProps {
  activeTab: TabType;
  groupId?: string;
  onAddClick?: () => void;
}

export function BottomNav({ activeTab, groupId: propGroupId, onAddClick }: BottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId: contextGroupId, isSettled } = useGroup();

  const groupId = propGroupId || contextGroupId;
  const addDisabled = !groupId || isSettled;

  const handleTabClick = (tab: TabType) => {
    if (!groupId) return;

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
      navigate(`/group/${groupId}`, { state: { openAddModal: true } });
    }
  };

  return (
    <div className="fixed-in-container bottom-0 z-20 pb-safe select-none">
      <div className="bg-white border-t-3 border-main-text shadow-[0_-8px_24px_rgba(26,26,46,0.06)] px-3 py-2 grid grid-cols-5 items-center rounded-t-[20px]">
        
        {/* Dashboard */}
        <button
          onClick={() => handleTabClick('dashboard')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-150 btn-bounce cursor-pointer ${
            !groupId ? 'opacity-30 cursor-not-allowed' :
            activeTab === 'dashboard' 
              ? 'text-accent-orange scale-105' 
              : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <LayoutGrid className="w-5.5 h-5.5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight truncate w-full text-center">{t('common.dashboard')}</span>
        </button>

        {/* Settlements */}
        <button
          onClick={() => handleTabClick('settlements')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-150 btn-bounce cursor-pointer ${
            !groupId ? 'opacity-30 cursor-not-allowed' : 
            activeTab === 'settlements' 
              ? 'text-accent-orange scale-105' 
              : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <DollarSign className="w-5.5 h-5.5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight truncate w-full text-center">{t('balances.title')}</span>
        </button>

        {/* Playful Float Add Button */}
        <div className="flex justify-center">
          <button
            onClick={handleAddClick}
            disabled={addDisabled}
            title={isSettled ? t('settle.locked_msg') : undefined}
            className={`flex flex-col items-center -mt-9 bg-accent-orange text-white p-3.5 rounded-[18px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] hover:bg-[#ff7b4b] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer ${
              addDisabled ? 'opacity-50 cursor-not-allowed grayscale shadow-none hover:scale-100' : ''
            }`}
          >
            {isSettled ? <Lock className="w-7 h-7 stroke-[3]" /> : <Plus className="w-7 h-7 stroke-[3]" />}
          </button>
        </div>

        {/* Expenses List */}
        <button
          onClick={() => handleTabClick('expenses')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-150 btn-bounce cursor-pointer ${
            !groupId ? 'opacity-30 cursor-not-allowed' :
            activeTab === 'expenses' 
              ? 'text-accent-orange scale-105' 
              : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <Receipt className="w-5.5 h-5.5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight truncate w-full text-center">{t('expenses.title')}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => handleTabClick('members')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all duration-150 btn-bounce cursor-pointer ${
            !groupId ? 'opacity-30 cursor-not-allowed' :
            activeTab === 'members' 
              ? 'text-accent-orange scale-105' 
              : 'text-gray-500 hover:text-main-text'
          }`}
        >
          <Users className="w-5.5 h-5.5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-tight truncate w-full text-center">{t('common.settings')}</span>
        </button>
      </div>
    </div>
  );
}
