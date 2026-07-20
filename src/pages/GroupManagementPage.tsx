import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Users, Shield, X, Plus, Copy, Trash2, Share2, Settings, Unlink, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import { BottomNav } from '../components/BottomNav';
import { AppHeader } from '../components/AppHeader';
import { ProfileModal } from '../components/ProfileModal';
import { shareGroup } from '../utils/shareGroup';
import { useGroup } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { APP_NAME } from '../constants';
import { OptionSelect } from '../components/OptionSelect';
import { calculateBalancesAndSettlements } from '../lib/settlement';
import {
  buildRateMap,
  getDefaultCurrency,
  getGroupCurrencies,
  recomputeCurrenciesForNewDefault,
  validateCurrencyCode,
} from '../utils/currency';
import type { Member } from '../types';

export function GroupManagementPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith('zh') ?? false;
  const { groupId } = useParams();
  const { confirm } = useDialog();
  const { handleDeleteAccount } = useAuth();
  const {
    members, expenses, completedSettlements, currentMember, currentGroup,
    handleUpdateProfile, handleDeleteMember, handleUpdateGroupName, handleDeleteGroup,
    handleCreateMemberByHost, handleLeaveGroup, handleUnclaimMember,
    handleUpdateGroupCurrencySettings
  } = useGroup();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newName, setNewName] = useState(currentGroup?.name || '');
  const [newMemberName, setNewMemberName] = useState('');
  const { balances } = useMemo(
    () => calculateBalancesAndSettlements(members, expenses, completedSettlements, buildRateMap(currentGroup)),
    [members, expenses, completedSettlements, currentGroup],
  );

  // Sync newName state when currentGroup loads
  const [prevGroupName, setPrevGroupName] = useState(currentGroup?.name);
  if (currentGroup?.name !== prevGroupName) {
    setPrevGroupName(currentGroup?.name);
    setNewName(currentGroup?.name || '');
  }

  // Currency settings state. Rate drafts are keyed by currency code and synced
  // from the group doc whenever the stored list changes (same pattern as newName).
  const defaultCurrency = getDefaultCurrency(currentGroup);
  const groupCurrencies = getGroupCurrencies(currentGroup);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('');
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const currenciesKey = JSON.stringify(groupCurrencies);
  const [prevCurrenciesKey, setPrevCurrenciesKey] = useState(currenciesKey);
  if (currenciesKey !== prevCurrenciesKey) {
    setPrevCurrenciesKey(currenciesKey);
    setRateDrafts({});
  }

  // Manual title fallback
  useEffect(() => {
    const title = currentGroup?.name 
      ? `${currentGroup.name} - ${APP_NAME}` 
      : `${t('common.settings')} - ${APP_NAME}`;
    document.title = title;
  }, [currentGroup?.name, t]);

  const handleSaveGroupName = async () => {
    if (newName.trim() && newName !== currentGroup?.name) {
      await handleUpdateGroupName(newName.trim());
      toast.success(t('common.success'));
    }
  };

  const handleChangeDefaultCurrency = async (newDefault: string) => {
    if (newDefault === defaultCurrency) return;
    const isConfirmed = await confirm(
      t('groups.default_currency_change_msg', { code: newDefault }),
      {
        title: t('groups.default_currency_change_title'),
        confirmLabel: t('common.confirm'),
        cancelLabel: t('common.cancel'),
      },
    );
    if (!isConfirmed) return;
    const recomputed = recomputeCurrenciesForNewDefault(groupCurrencies, newDefault);
    await handleUpdateGroupCurrencySettings(newDefault, recomputed);
    toast.success(t('groups.currency_updated'));
  };

  const handleSaveCurrencyRate = async (code: string) => {
    const draft = rateDrafts[code];
    if (draft === undefined) return;
    const rate = parseFloat(draft);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error(t('groups.currency_rate_invalid'));
      return;
    }
    const updated = groupCurrencies.map(c => (c.code === code ? { code, rate } : c));
    await handleUpdateGroupCurrencySettings(defaultCurrency, updated);
    toast.success(t('groups.currency_updated'));
  };

  const handleAddCurrency = async () => {
    const code = newCurrencyCode.trim();
    const rate = parseFloat(newCurrencyRate);
    if (!validateCurrencyCode(code)) {
      toast.error(t('groups.currency_code_invalid'));
      return;
    }
    if (groupCurrencies.some(c => c.code === code)) {
      toast.error(t('groups.currency_duplicate'));
      return;
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error(t('groups.currency_rate_invalid'));
      return;
    }
    await handleUpdateGroupCurrencySettings(defaultCurrency, [...groupCurrencies, { code, rate }]);
    setNewCurrencyCode('');
    setNewCurrencyRate('');
    toast.success(t('groups.currency_updated'));
  };

  const handleRemoveCurrency = async (code: string) => {
    // The default can't be removed (its row has no remove button); block
    // removing any currency that expenses still reference — silently falling
    // back to rate 1 would corrupt balances retroactively.
    const inUseCount = expenses.filter(e => e.currency === code).length;
    if (inUseCount > 0) {
      toast.error(t('groups.currency_in_use_error', { code, count: inUseCount }));
      return;
    }
    const isConfirmed = await confirm(t('groups.delete_currency_msg', { code }), {
      title: t('groups.delete_currency'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (!isConfirmed) return;
    await handleUpdateGroupCurrencySettings(
      defaultCurrency,
      groupCurrencies.filter(c => c.code !== code),
    );
    toast.success(t('groups.currency_updated'));
  };

  const handleDeleteMemberByHost = async (member: Member) => {
    const balance = balances[member.id] || 0;
    if (Math.abs(balance) > 0.01) {
      const balanceStr = balance > 0 
        ? t('members.receivable', { amount: balance.toFixed(0) }) 
        : t('members.owe', { amount: Math.abs(balance).toFixed(0) });
      toast.error(t('members.error_unsettled', { name: member.name, balance: balanceStr }));
      return;
    }
    const isConfirmed = await confirm(t('members.delete_member_msg', { name: member.name }));
    if (isConfirmed) {
      await handleDeleteMember(member.id);
      toast.success(t('common.success'));
    }
  };

  const handleUnclaimMemberByHost = async (member: Member) => {
    const isConfirmed = await confirm(t('members.unclaim_member_msg', { name: member.name }), {
      title: t('members.unclaim_member'),
      confirmLabel: t('members.unclaim_member'),
      cancelLabel: t('common.cancel'),
    });
    if (isConfirmed) {
      await handleUnclaimMember(member.id);
      toast.success(t('common.success'));
    }
  };

  const handleAddMember = async () => {
    if (newMemberName.trim()) {
      await handleCreateMemberByHost(newMemberName.trim());
      setNewMemberName('');
      toast.success(t('common.success'));
    }
  };

  if (!currentMember || !groupId) return null;

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta pb-28 flex flex-col justify-start">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.settings')} - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.settings')} - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.settings')} - ${APP_NAME}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
        showGroups
      />

      <main className="w-full mx-auto px-5 py-6 space-y-6 flex-1">
        
        {/* Title display */}
        <div className="stagger-item flex items-center justify-between gap-4 p-5 bg-white border-3 border-main-text rounded-[24px] shadow-[4px_4px_0px_#1A1A2E]" style={{ animationDelay: '0ms' }}>
          <div className="min-w-0 flex-1">
            <h1 className="text-2.5xl font-nunito font-black text-main-text truncate leading-tight">
              {t('common.settings') || 'Settings'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-accent-orange rounded-full" />
              <span className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60">
                {currentGroup?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Group Info Section */}
        <section className="stagger-item space-y-3" style={{ animationDelay: '60ms' }}>
          <h2 className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60 flex items-center gap-1.5 px-1">
            <Settings className="w-4 h-4 text-accent-orange stroke-[2.5]" /> {t('groups.group_info')}
          </h2>
          
          <div className="bg-white rounded-[20px] border-3 border-main-text p-5 space-y-4 shadow-[3px_3px_0px_#1A1A2E]">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50">{t('groups.group_name')}</span>
              {currentMember.isHost ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-grow px-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white"
                  />
                  <button
                    onClick={handleSaveGroupName}
                    disabled={!newName.trim() || newName === currentGroup?.name}
                    className="px-4 py-2 bg-accent-orange text-white border-2 border-main-text rounded-xl font-nunito font-black text-xs shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer whitespace-nowrap"
                  >
                    {t('common.save')}
                  </button>
                </div>
              ) : (
                <span className="text-base font-bold text-main-text">{currentGroup?.name}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
              <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50">{t('groups.group_id')}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-brand-light border border-main-text/10 px-2.5 py-1 rounded-lg font-mono font-bold text-accent-orange">{currentGroup?.joinId || currentGroup?.id}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentGroup?.joinId || currentGroup?.id || '');
                    toast.success(t('groups.id_copied'));
                  }}
                  className="p-1.5 text-main-text hover:text-accent-orange bg-white border-2 border-transparent hover:border-main-text rounded-lg transition-colors cursor-pointer"
                  title={t('common.copy')}
                >
                  <Copy className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
              <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50">{t('common.share')}</span>
              <button
                onClick={() => shareGroup({ groupName: currentGroup?.name, joinId: currentGroup?.joinId || currentGroup?.id, groupId, isZh })}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-xs border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer hover:bg-white transition-all shrink-0"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                {t('groups.share_link')}
              </button>
            </div>
          </div>
        </section>

        {/* Currency Settings Section */}
        <section className="stagger-item space-y-3 pt-3" style={{ animationDelay: '90ms' }}>
          <h2 className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60 flex items-center gap-1.5 px-1">
            <Coins className="w-4 h-4 text-accent-orange stroke-[2.5]" /> {t('groups.currency_settings')}
          </h2>

          <div className="bg-white rounded-[20px] border-3 border-main-text p-5 space-y-4 shadow-[3px_3px_0px_#1A1A2E]">
            {/* Default currency picker */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50">{t('groups.default_currency')}</span>
              {currentMember.isHost ? (
                <OptionSelect
                  value={defaultCurrency}
                  options={groupCurrencies.map(c => ({ id: c.code, label: c.code }))}
                  onChange={handleChangeDefaultCurrency}
                />
              ) : (
                <span className="text-base font-bold text-main-text font-nunito">{defaultCurrency}</span>
              )}
            </div>

            {/* Currency list with exchange rates */}
            {groupCurrencies.filter(c => c.code !== defaultCurrency).map(c => (
              <div key={c.code} className="flex flex-col gap-2 border-t border-dashed border-gray-100 pt-3">
                <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50">
                  {c.code} · {t('groups.exchange_rate')}
                </span>
                {currentMember.isHost ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-base font-nunito font-black text-main-text whitespace-nowrap">1 {c.code} =</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={rateDrafts[c.code] ?? String(c.rate)}
                      onChange={(e) => setRateDrafts(prev => ({ ...prev, [c.code]: e.target.value }))}
                      className="no-spinner flex-grow min-w-0 px-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white"
                    />
                    <span className="text-base font-nunito font-black text-main-text whitespace-nowrap">{defaultCurrency}</span>
                    <button
                      onClick={() => handleSaveCurrencyRate(c.code)}
                      disabled={rateDrafts[c.code] === undefined || rateDrafts[c.code] === String(c.rate)}
                      className="px-4 py-2 bg-accent-orange text-white border-2 border-main-text rounded-xl font-nunito font-black text-xs shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer whitespace-nowrap"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => handleRemoveCurrency(c.code)}
                      className="p-1.5 border-2 border-main-text text-red-500 bg-white rounded-lg transition-all duration-150 cursor-pointer hover:bg-red-50 hover:scale-105 active:scale-95"
                      title={t('common.delete')}
                    >
                      <X className="w-4.5 h-4.5 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <span className="text-base font-bold text-main-text font-nunito">
                    1 {c.code} = {c.rate} {defaultCurrency}
                  </span>
                )}
              </div>
            ))}

            {/* Add-currency row (host only) */}
            {currentMember.isHost && (
              <div className="flex flex-col gap-2 border-t border-dashed border-gray-100 pt-3">
                <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50">{t('groups.add_currency')}</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder={t('groups.currency_code_placeholder')}
                    value={newCurrencyCode}
                    onChange={(e) => setNewCurrencyCode(e.target.value)}
                    className="w-24 px-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white font-nunito"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder={t('groups.exchange_rate')}
                    value={newCurrencyRate}
                    onChange={(e) => setNewCurrencyRate(e.target.value)}
                    className="no-spinner flex-grow min-w-0 px-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white"
                  />
                  <button
                    onClick={handleAddCurrency}
                    disabled={!newCurrencyCode.trim() || !newCurrencyRate.trim()}
                    className="px-4 py-2 bg-accent-orange text-white border-2 border-main-text rounded-xl font-nunito font-black text-sm shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    {t('common.add')}
                  </button>
                </div>
                {newCurrencyCode.trim() && newCurrencyRate && parseFloat(newCurrencyRate) > 0 && (
                  <p className="text-xs font-bold text-main-text/50">
                    {t('groups.currency_rate_hint', { code: newCurrencyCode.trim(), rate: newCurrencyRate, default: defaultCurrency })}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Members Section */}
        <section className="stagger-item space-y-3 pt-3" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent-orange stroke-[2.5]" /> {t('members.list')}
            </h2>
            <span className="text-xs font-black text-accent-orange bg-brand-light px-2.5 py-0.5 rounded-full border border-accent-orange/15 font-nunito">
              {t('members.count', { count: members.length })}
            </span>
          </div>

          <div className="bg-white rounded-[20px] border-3 border-main-text overflow-hidden divide-y-2 divide-main-text shadow-[3px_3px_0px_#1A1A2E]">
            {members.map(m => {
              const balance = balances[m.id] || 0;
              const canDelete = Math.abs(balance) < 0.01 && m.id !== currentMember.id;
              const isClaimedByOthers = m.userId && m.userId !== currentMember.userId;

              return (
                <div key={m.id} className="flex items-center justify-between p-4 bg-white hover:bg-page-bg/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-light text-accent-orange border-2 border-main-text rounded-xl flex items-center justify-center font-nunito font-black text-base shadow-[2px_2px_0px_#1A1A2E]">
                      {m.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-main-text flex items-center gap-1.5 flex-wrap">
                        <span>{m.name}</span>
                        {m.id === currentMember.id && <span className="text-[10px] text-accent-orange font-black uppercase font-nunito bg-[#FFF0EA] px-1.5 py-0.2 rounded">({t('members.you')})</span>}
                        {m.isHost && <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500 stroke-main-text" />}
                        {m.userId ? (
                          <span className="text-[10px] text-success-green font-black uppercase font-nunito bg-success-light border border-success-green/20 px-1.5 py-0.5 rounded-md">
                            {t('members.claimed')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-black uppercase font-nunito bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md">
                            {t('members.not_claimed')}
                          </span>
                        )}
                      </span>
                      <span className={`text-xs font-bold font-nunito ${Math.abs(balance) < 0.01 ? 'text-success-green' : balance > 0 ? 'text-accent-orange' : 'text-red-500'}`}>
                        {Math.abs(balance) < 0.01 
                          ? t('members.settled') 
                          : balance > 0 
                            ? t('members.receivable', { amount: balance.toFixed(0) }) 
                            : t('members.owe', { amount: Math.abs(balance).toFixed(0) })
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isClaimedByOthers && currentMember.isHost && (
                      <button
                        type="button"
                        onClick={() => handleUnclaimMemberByHost(m)}
                        className="p-1.5 border-2 border-main-text text-main-text bg-white rounded-lg transition-all duration-150 cursor-pointer hover:bg-brand-light hover:scale-105 active:scale-95"
                        title={t('members.unclaim_member')}
                      >
                        <Unlink className="w-4.5 h-4.5 stroke-[2.5]" />
                      </button>
                    )}
                    {m.id !== currentMember.id && currentMember.isHost && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMemberByHost(m)}
                        disabled={!canDelete}
                        className={`p-1.5 border-2 rounded-lg transition-all duration-150 cursor-pointer ${canDelete
                          ? 'border-main-text text-red-500 bg-white hover:bg-red-50 hover:scale-105 active:scale-95'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed'
                        }`}
                        title={!canDelete ? (i18n.resolvedLanguage?.startsWith('zh') ? "餘額未結清" : "Balance not settled") : t('members.delete_member')}
                      >
                        <X className="w-4.5 h-4.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {currentMember.isHost && (
            <div className="bg-white rounded-[20px] border-3 border-main-text p-4 mt-2 shadow-[2px_2px_0px_#1A1A2E]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('members.enter_name')}
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                  className="flex-grow px-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="px-4 py-2 bg-accent-orange text-white border-2 border-main-text rounded-xl font-nunito font-black text-sm shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  {t('common.add')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Danger Zone Section */}
        <section className="stagger-item space-y-3 pt-3" style={{ animationDelay: '180ms' }}>
          <h2 className="text-xs font-black font-nunito uppercase tracking-wider text-red-500 flex items-center gap-1.5 px-1">
            <Shield className="w-4 h-4 text-red-500 stroke-[2.5]" /> {t('groups.danger_zone')}
          </h2>
          
          <div className="bg-white rounded-[20px] border-3 border-red-500 p-6 space-y-4 shadow-[4px_4px_0px_rgba(239,68,68,0.1)]">
            {currentMember.isHost ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-nunito font-black text-red-500 leading-tight">{t('groups.delete_group')}</h3>
                  <p className="text-xs font-medium text-gray-500 mt-1">{t('groups.delete_group_msg', { name: currentGroup?.name })}</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleDeleteGroup}
                  className="w-full py-3 bg-red-50 text-red-600 border-2 border-red-500 rounded-xl font-nunito font-black text-sm shadow-[3px_3px_0px_rgba(239,68,68,0.15)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(239,68,68,0.15)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  {t('groups.delete_group')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-nunito font-black text-red-500 leading-tight">{t('groups.leave_group')}</h3>
                  <p className="text-xs font-medium text-gray-500 mt-1">{t('groups.leave_group_msg', { name: currentGroup?.name })}</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleLeaveGroup}
                  className="w-full py-3 bg-red-50 text-red-600 border-2 border-red-500 rounded-xl font-nunito font-black text-sm shadow-[3px_3px_0px_rgba(239,68,68,0.15)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(239,68,68,0.15)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  {t('groups.leave_group')}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav
        activeTab="members"
        groupId={groupId}
      />

      {isProfileModalOpen && (
        <ProfileModal
          currentMember={currentMember}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={async (data) => {
            await handleUpdateProfile(data);
            setIsProfileModalOpen(false);
          }}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
