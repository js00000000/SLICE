import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense, Payment } from '../types';
import { calculateEvenSplit, isCustomSplit as detectCustomSplit } from '../utils/split';
import { useScrollLock } from '../hooks/useScrollLock';

interface ExpenseModalProps {
  members: Member[];
  currentMemberId: string;
  initialData: Expense | null;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>, id?: string) => void;
}

export function ExpenseModal({ members, currentMemberId, initialData, onClose, onSave }: ExpenseModalProps) {
  useScrollLock();
  const { t, i18n } = useTranslation();
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [paidBy, setPaidBy] = useState(initialData ? initialData.paidBy : currentMemberId);
  const [splitAmong, setSplitAmong] = useState<string[]>(initialData ? initialData.splitAmong : []);
  
  const [isMultiplePayers, setIsMultiplePayers] = useState(!!initialData?.payments && initialData.payments.length > 1);
  const [payments, setPayments] = useState<Payment[]>(
    initialData?.payments && initialData.payments.length > 0 
      ? initialData.payments 
      : [{ memberId: initialData?.paidBy || currentMemberId, amount: initialData ? initialData.amount : 0 }]
  );

  const wasOriginalCustomSplit = detectCustomSplit(initialData?.splits);

  const [isCustomSplit, setIsCustomSplit] = useState(wasOriginalCustomSplit);
  const [splits, setSplits] = useState<Payment[]>(
    initialData?.splits && initialData.splits.length > 0
      ? initialData.splits
      : []
  );

  const isEditing = !!initialData;
  const isAllSelected = members.length > 0 && splitAmong.length === members.length;

  const firstPayerAmountRef = useRef<HTMLInputElement>(null);

  const toggleMultiplePayers = () => {
    if (!isMultiplePayers) {
      const secondMember = members.find(m => m.id !== paidBy);
      const initialPayments: Payment[] = [{ memberId: paidBy, amount: 0 }];
      if (secondMember) {
        initialPayments.push({ memberId: secondMember.id, amount: 0 });
      }
      setPayments(initialPayments);
      setIsMultiplePayers(true);
      requestAnimationFrame(() => firstPayerAmountRef.current?.focus());
    } else {
      setIsMultiplePayers(false);
    }
  };

  useEffect(() => {
    if (!isMultiplePayers) {
      setPayments([{ memberId: paidBy, amount: parseFloat(amount) || 0 }]);
    }
  }, [paidBy, amount, isMultiplePayers]);

  useEffect(() => {
    if (isCustomSplit) {
      setSplits(prev => {
        const newSplits = splitAmong.map(id => {
          const existing = prev.find(p => p.memberId === id);
          return existing || { memberId: id, amount: 0 };
        });
        return newSplits;
      });
    } else {
      setSplits([]);
    }
  }, [splitAmong, isCustomSplit]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDiff = Math.abs(totalPaid - parseFloat(amount || '0'));
  const isAmountValid = !isMultiplePayers || amountDiff < 0.01;

  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  const splitDiff = Math.abs(totalSplit - parseFloat(amount || '0'));
  const isSplitValid = !isCustomSplit || splitDiff < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || (isCustomSplit ? splits.filter(s => s.amount > 0).length === 0 : splitAmong.length === 0) || !isAmountValid || !isSplitValid) return;
    if (isMultiplePayers && payments.filter(p => p.amount > 0).length === 0) return;

    const finalSplitAmong = isCustomSplit 
      ? splits.filter(s => s.amount > 0).map(s => s.memberId)
      : splitAmong;

    const finalSplits = isCustomSplit
      ? splits.filter(s => s.amount > 0)
      : calculateEvenSplit(parseFloat(amount) || 0, splitAmong);

    const finalPayments = isMultiplePayers
      ? payments.filter(p => p.amount > 0)
      : [{ memberId: paidBy, amount: parseFloat(amount) }];

    onSave({
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy: isMultiplePayers ? finalPayments[0].memberId : paidBy,
      payments: finalPayments,
      splitAmong: finalSplitAmong,
      splits: finalSplits
    }, initialData?.id);
  };

  const toggleSplitMember = (id: string) => {
    setSplitAmong(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleCustomSplit = () => {
    if (!isCustomSplit) {
      setSplits(members.map(m => {
        const originalSplit = wasOriginalCustomSplit
          ? initialData?.splits?.find(s => s.memberId === m.id)
          : undefined;
        return { 
          memberId: m.id, 
          amount: originalSplit ? originalSplit.amount : 0 
        };
      }));
    }
    setIsCustomSplit(!isCustomSplit);
  };

  const updateSplitAmount = (memberId: string, amount: number) => {
    setSplits(prev => {
      const existing = prev.find(s => s.memberId === memberId);
      if (existing) {
        return prev.map(s => s.memberId === memberId ? { ...s, amount } : s);
      } else {
        return [...prev, { memberId, amount }];
      }
    });
  };

  const addPayer = () => {
    const existingMemberIds = payments.map(p => p.memberId);
    const availableMember = members.find(m => !existingMemberIds.includes(m.id)) || members[0];
    setPayments([...payments, { memberId: availableMember.id, amount: 0 }]);
  };

  const removePayer = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayer = (index: number, data: Partial<Payment>) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], ...data };
    setPayments(newPayments);
  };

  return (
    <div
      className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-50 flex items-end justify-center pt-16 sm:pt-20 px-0 pb-0 animate-in fade-in duration-200 select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-t-[24px] border-t-3 border-x-3 border-main-text shadow-[0_-12px_40px_rgba(26,26,46,0.15)] flex flex-col max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] overflow-hidden animate-slide-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <h2 className="text-2xl font-nunito font-black text-main-text">
            {isEditing ? t('expenses.edit') : t('expenses.add_new')}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-main-text hover:text-accent-orange p-1.5 rounded-lg border-2 border-transparent hover:border-main-text hover:bg-white transition-all cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 font-plus-jakarta">
          <div className="space-y-5">
            
            {/* Description Input (Font size 16px to prevent iOS zoom) */}
            <div>
              <label className="block text-xs font-black uppercase font-nunito tracking-wider text-main-text/60 mb-1.5">
                {t('expenses.description')}
              </label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder={i18n.resolvedLanguage?.startsWith('zh') ? "例如：晚餐、計程車" : "e.g. Dinner, Taxi"}
                className="w-full text-base font-bold text-main-text px-4 py-3 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none placeholder-gray-400 bg-white transition-all"
                required
              />
            </div>

            {/* Amount Input (Font size 16px to prevent iOS zoom) */}
            <div>
              <label className="block text-xs font-black uppercase font-nunito tracking-wider text-main-text/60 mb-1.5">
                {t('expenses.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-main-text font-nunito font-black text-lg">$</span>
                <input 
                  type="number" 
                  min="0" 
                  step="any" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-base font-nunito font-black text-main-text pl-8 pr-4 py-3 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none placeholder-gray-400 bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Paid By Control */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase font-nunito tracking-wider text-main-text/60">
                  {t('expenses.paid_by')}
                </label>
                {members.length >= 2 && (
                  <button
                    type="button"
                    onClick={toggleMultiplePayers}
                    className="text-xs font-black font-nunito text-accent-orange hover:underline cursor-pointer"
                  >
                    {isMultiplePayers ? t('expenses.single_payer') : t('expenses.multiple_payers')}
                  </button>
                )}
              </div>

              {!isMultiplePayers ? (
                <PayerSelect
                  value={paidBy}
                  members={members}
                  onChange={setPaidBy}
                  size="md"
                />
              ) : (
                <div className="space-y-3 bg-page-bg/50 p-3.5 rounded-xl border-2 border-dashed border-main-text/20">
                  {payments.map((p, index) => {
                    const otherPayerIds = payments
                      .filter((_, i) => i !== index)
                      .map(op => op.memberId);
                    
                    return (
                      <div key={index} className="flex gap-2 items-center">
                        <PayerSelect
                          value={p.memberId}
                          members={members}
                          disabledIds={otherPayerIds}
                          onChange={(id) => updatePayer(index, { memberId: id })}
                        />
                        
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-main-text font-nunito font-black">$</span>
                          <input
                            ref={index === 0 ? firstPayerAmountRef : undefined}
                            type="number"
                            step="any"
                            value={p.amount || ''}
                            onChange={(e) => updatePayer(index, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full text-base font-nunito font-black text-main-text pl-7 pr-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        
                        {payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePayer(index)}
                            className="p-2 text-main-text hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  {payments.length < members.length && (
                    <button
                      type="button"
                      onClick={addPayer}
                      className="flex items-center gap-1.5 text-xs font-black font-nunito text-accent-orange hover:bg-brand-light px-3 py-1.5 border border-dashed border-accent-orange/40 rounded-lg cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      {t('expenses.add_payer')}
                    </button>
                  )}
                  
                  {!isAmountValid && (
                    <p className="text-red-500 text-xs font-bold mt-1">
                      {t('expenses.total_amount_mismatch', { 
                        diff: (parseFloat(amount || '0') - totalPaid).toFixed(2) 
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Split Among Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase font-nunito tracking-wider text-main-text/60">
                  {t('expenses.split_among')}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={toggleCustomSplit}
                    className="text-xs font-black font-nunito text-accent-orange hover:underline cursor-pointer"
                  >
                    {isCustomSplit ? t('expenses.equal_split') : t('expenses.custom_split')}
                  </button>
                  {!isCustomSplit && (
                    <button 
                      type="button" 
                      onClick={() => setSplitAmong(isAllSelected ? [] : members.map(m => m.id))}
                      className="text-xs font-black font-nunito text-accent-orange hover:underline cursor-pointer"
                    >
                      {isAllSelected ? (i18n.resolvedLanguage?.startsWith('zh') ? '全不選' : 'Unselect All') : t('expenses.select_all')}
                    </button>
                  )}
                </div>
              </div>

              {isCustomSplit ? (
                <div className="space-y-2.5 mb-4 bg-page-bg/50 p-3.5 rounded-xl border-2 border-dashed border-main-text/20">
                  {members.map((m) => {
                    const split = splits.find(s => s.memberId === m.id) || { memberId: m.id, amount: 0 };
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <div className="flex-1 text-sm font-bold text-main-text truncate">{m.name}</div>
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-main-text font-nunito font-black">$</span>
                          <input
                            type="number"
                            step="any"
                            value={split.amount || ''}
                            onChange={(e) => updateSplitAmount(m.id, parseFloat(e.target.value) || 0)}
                            className="w-full text-base font-nunito font-black text-main-text pl-7 pr-3 py-2 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!isSplitValid && (
                    <p className="text-red-500 text-xs font-bold mt-1">
                      {t('expenses.split_amount_mismatch', { 
                        diff: (parseFloat(amount || '0') - totalSplit).toFixed(2) 
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {members.map(m => {
                    const isSelected = splitAmong.includes(m.id);
                    return (
                      <button 
                        key={m.id} 
                        type="button" 
                        onClick={() => toggleSplitMember(m.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-bold transition-all duration-150 text-left cursor-pointer ${
                          isSelected
                            ? 'border-main-text bg-brand-light text-main-text shadow-[2px_2px_0px_#1A1A2E]'
                            : 'border-gray-200 text-gray-500 hover:border-main-text hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-accent-orange border-main-text' : 'border-gray-300'}`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {!isCustomSplit && splitAmong.length === 0 && (
                <p className="text-red-500 text-xs font-bold mt-1.5">
                  {i18n.resolvedLanguage?.startsWith('zh') ? '請至少選擇一位分帳成員' : 'Please select at least one member'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t-3 border-main-text bg-white shrink-0">
          <button 
            type="submit" 
            disabled={!description || !amount || (isCustomSplit ? splits.filter(s => s.amount > 0).length === 0 : splitAmong.length === 0) || !isAmountValid || !isSplitValid}
            className="w-full py-4 bg-accent-orange text-white rounded-xl font-nunito font-black text-lg border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
          >
            {isEditing ? t('common.save') : t('common.confirm')}
          </button>
        </div>
      </form>
    </div>
  );
}

interface PayerSelectProps {
  value: string;
  members: Member[];
  disabledIds?: string[];
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
}

function PayerSelect({ value, members, disabledIds = [], onChange, size = 'sm' }: PayerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePos = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const selected = members.find(m => m.id === value);
  const triggerPadding = size === 'md' ? 'px-4 py-3' : 'px-3 py-2';

  return (
    <div className="flex-1 min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-base font-bold text-main-text ${triggerPadding} border-2 border-main-text rounded-xl bg-white shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all cursor-pointer`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left">{selected?.name ?? ''}</span>
        <ChevronDown className={`w-4 h-4 stroke-[3] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && panelPos && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
          className="fixed z-[60] max-h-72 overflow-y-auto bg-white border-2 border-main-text rounded-xl shadow-[4px_4px_0px_#1A1A2E] p-1"
        >
          {members.map(m => {
            const isActive = m.id === value;
            const isDisabled = !isActive && disabledIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={isDisabled}
                onClick={() => {
                  onChange(m.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-nunito font-black text-sm text-left transition-colors ${
                  isDisabled
                    ? 'text-main-text/30 cursor-not-allowed'
                    : isActive
                      ? 'bg-accent-orange text-white cursor-pointer'
                      : 'text-main-text hover:bg-brand-light cursor-pointer'
                }`}
              >
                <span className="truncate">{m.name}</span>
                {isActive && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
