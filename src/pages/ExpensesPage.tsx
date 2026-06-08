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

  // Manual title fallback
  useEffect(() => {
    const title = currentGroup?.name
      ? `${currentGroup.name} - ${APP_NAME}`
      : `${t('expenses.title')} - ${APP_NAME}`;
    document.title = title;
  }, [currentGroup?.name, t]);

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
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta pb-28 flex flex-col justify-start">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('expenses.title')} - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('expenses.title')} - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('expenses.title')} - ${APP_NAME}`} />
      </Helmet>

      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
        showGroups
      />

      <main className="w-full mx-auto px-5 py-6 space-y-6 flex-1">

        {/* Header Dashboard section */}
        <div className="stagger-item flex items-center justify-between gap-4 p-5 bg-white border-3 border-main-text rounded-[24px] shadow-[4px_4px_0px_#1A1A2E]" style={{ animationDelay: '0ms' }}>
          <div className="min-w-0 flex-1">
            <h1 className="text-2.5xl font-nunito font-black text-main-text truncate leading-tight">
              {currentGroup?.name || 'Group Dashboard'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-accent-orange rounded-full" />
              <span className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60">
                {expenses.length} {t('expenses.title')}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const url = `${window.location.origin}/join/${groupId}`;
              navigator.clipboard.writeText(url);
              toast.success(t('groups.link_copied'));
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer hover:bg-white transition-all shrink-0"
            title={t('common.share')}
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">{t('common.share') || 'Share'}</span>
          </button>
        </div>

        {/* Expenses List */}
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
