import { LayoutGrid, DollarSign, Plus, Receipt, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../contexts/GroupContext';

export type TabType = 'expenses' | 'settlements' | 'members' | 'groups';

interface BottomNavProps {
  activeTab: TabType;
  groupId?: string;
  onTabChange?: (tab: 'expenses' | 'settlements') => void;
  onAddClick?: () => void;
}

export function BottomNav({ activeTab, groupId: propGroupId, onTabChange, onAddClick }: BottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupId: contextGroupId } = useGroup();
  
  const groupId = propGroupId || contextGroupId;

  const handleTabClick = (tab: TabType) => {
    if (tab === 'groups') {
      navigate('/');
      return;
    }

    if (!groupId) return;

    if (tab === 'members') {
      navigate(`/group/${groupId}/members`);
      return;
    }

    if (tab === 'expenses') {
      if (onTabChange) {
        onTabChange(tab);
      } else {
        navigate(`/group/${groupId}`);
      }
      return;
    }

    if (tab === 'settlements') {
      if (onTabChange) {
        onTabChange(tab);
      } else {
        navigate(`/group/${groupId}/settlements`);
      }
      return;
    }
  };

  return (
    <div className="fixed-in-container bottom-0 z-20 pb-safe">
      <div className="bg-white border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-2 py-2 grid grid-cols-5 items-center">
        <button
          onClick={() => handleTabClick('groups')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTab === 'groups' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium truncate w-full px-1 text-center">{t('groups.my_groups')}</span>
        </button>

        <button
          onClick={() => handleTabClick('settlements')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            !groupId ? 'opacity-30 cursor-not-allowed' : 
            activeTab === 'settlements' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-medium truncate w-full px-1 text-center">{t('balances.title')}</span>
        </button>

        {/* Add Action */}
        <div className="flex justify-center">
          <button
            onClick={onAddClick}
            disabled={!groupId}
            className={`flex flex-col items-center -mt-8 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all ${
              !groupId ? 'opacity-50 cursor-not-allowed grayscale' : ''
            }`}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <button
          onClick={() => handleTabClick('expenses')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            !groupId ? 'opacity-30 cursor-not-allowed' :
            activeTab === 'expenses' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-medium truncate w-full px-1 text-center">{t('expenses.title')}</span>
        </button>

        <button
          onClick={() => handleTabClick('members')}
          disabled={!groupId}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            !groupId ? 'opacity-30 cursor-not-allowed' :
            activeTab === 'members' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium truncate w-full px-1 text-center">{t('members.title')}</span>
        </button>
      </div>
    </div>
  );
}
