import { useState, useMemo, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { APP_NAME } from '../constants';
import type { Expense } from '../types';
import { ExpensesList } from '../components/ExpensesList';
import { ExpenseModal } from '../components/ExpenseModal';
import { ProfileModal } from '../components/ProfileModal';
import { BottomNav } from '../components/BottomNav';
import { AppHeader } from '../components/AppHeader';
import { useGroup } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';

export function ExpensesPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const { handleLogout, handleDeleteAccount } = useAuth();
  const {
    groupId,
    currentGroup,
    members,
    expenses,
    currentMemberId,
    currentMember,
    handleUpdateProfile,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
  } = useGroup();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [filterPaidBy, setFilterPaidBy] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsExpenseModalOpen(true);
      setExpenseToEdit(null);
      // Clear the state so it doesn't reopen on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredExpenses = useMemo(() => {
    if (!filterPaidBy) return expenses;
    return expenses.filter(exp => 
      exp.paidBy === filterPaidBy || 
      (exp.payments && exp.payments.some(p => p.memberId === filterPaidBy))
    );
  }, [expenses, filterPaidBy]);

  const openAddModal = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  if (!currentMember || !groupId) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `Expenses - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `Expenses - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `Expenses - ${APP_NAME}`} />
      </Helmet>
      
      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
      />

      <main className="w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {currentGroup?.name || 'Group Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">
              {expenses.length} {t('expenses.title')}
            </p>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/join/${groupId}`;
              navigator.clipboard.writeText(url);
              toast.success(t('groups.link_copied'));
            }}
            className="flex items-center gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shrink-0"
            title={t('common.share')}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden text-sm font-medium">{t('common.share')}</span>
          </button>
        </div>

        <ExpensesList
          expenses={filteredExpenses}
          members={members}
          onEdit={openEditModal}
          onDelete={async (expense) => {
            await handleDeleteExpense(expense);
          }}
          filterPaidBy={filterPaidBy}
          onFilterChange={setFilterPaidBy}
        />
      </main>

      <BottomNav
        activeTab="expenses"
        groupId={groupId}
        onAddClick={openAddModal}
      />

      {isExpenseModalOpen && (
        <ExpenseModal
          members={members}
          currentMemberId={currentMemberId!}
          initialData={expenseToEdit}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
          onSave={async (data, id) => {
            if (id) {
              await handleUpdateExpense(id, data);
              toast.success(t('expenses.updated'));
            } else {
              await handleAddExpense(data);
              toast.success(t('expenses.added'));
            }
            setIsExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          currentMember={currentMember}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={async (data) => {
            await handleUpdateProfile(data);
            setIsProfileModalOpen(false);
          }}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
