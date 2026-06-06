import { useState, useEffect } from 'react';
import { X, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense, Payment } from '../types';

interface ExpenseModalProps {
  members: Member[];
  currentMemberId: string;
  initialData: Expense | null;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>, id?: string) => void;
}

export function ExpenseModal({ members, currentMemberId, initialData, onClose, onSave }: ExpenseModalProps) {
  const { t, i18n } = useTranslation();
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [paidBy, setPaidBy] = useState(initialData ? initialData.paidBy : currentMemberId);
  const [splitAmong, setSplitAmong] = useState<string[]>(initialData ? initialData.splitAmong : members.map(m => m.id));
  
  const [isMultiplePayers, setIsMultiplePayers] = useState(!!initialData?.payments && initialData.payments.length > 1);
  const [payments, setPayments] = useState<Payment[]>(
    initialData?.payments && initialData.payments.length > 0 
      ? initialData.payments 
      : [{ memberId: initialData?.paidBy || currentMemberId, amount: initialData ? initialData.amount : 0 }]
  );

  const [isCustomSplit, setIsCustomSplit] = useState(!!initialData?.splits && initialData.splits.length > 0);
  const [splits, setSplits] = useState<Payment[]>(
    initialData?.splits && initialData.splits.length > 0
      ? initialData.splits
      : []
  );

  const isEditing = !!initialData;
  const isAllSelected = members.length > 0 && splitAmong.length === members.length;

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

    const finalSplitAmong = isCustomSplit 
      ? splits.filter(s => s.amount > 0).map(s => s.memberId)
      : splitAmong;

    onSave({
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy: isMultiplePayers ? payments[0].memberId : paidBy,
      payments: isMultiplePayers ? payments : [{ memberId: paidBy, amount: parseFloat(amount) }],
      splitAmong: finalSplitAmong,
      splits: isCustomSplit ? splits.filter(s => s.amount > 0) : undefined
    }, initialData?.id);
  };

  const toggleSplitMember = (id: string) => {
    setSplitAmong(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleCustomSplit = () => {
    if (!isCustomSplit) {
      setSplits(members.map(m => ({ 
        memberId: m.id, 
        amount: 0 
      })));
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{isEditing ? t('expenses.edit') : t('expenses.add_new')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.description')}</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={i18n.language.startsWith('zh') ? "例如：晚餐、計程車" : "e.g. Dinner, Taxi"}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600
                focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.amount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" min="0" step="any" value={amount} onChange={(e) =>
                  setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600
                  focus:border-transparent outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">{t('expenses.paid_by')}</label>
                <button
                  type="button"
                  onClick={() => setIsMultiplePayers(!isMultiplePayers)}
                  className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                >
                  {isMultiplePayers ? t('expenses.single_payer') : t('expenses.multiple_payers')}
                </button>
              </div>

              {!isMultiplePayers ? (
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600
                  focus:border-transparent outline-none bg-white"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  {payments.map((p, index) => {
                    const otherPayerIds = payments
                      .filter((_, i) => i !== index)
                      .map(op => op.memberId);
                    
                    return (
                      <div key={index} className="flex gap-2">
                        <select 
                          value={p.memberId} 
                          onChange={(e) => updatePayer(index, { memberId: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none bg-white"
                        >
                          {members.map(m => (
                            <option 
                              key={m.id} 
                              value={m.id}
                              disabled={otherPayerIds.includes(m.id)}
                            >
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            step="any"
                            value={p.amount || ''}
                            onChange={(e) => updatePayer(index, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-6 pr-3 py-2 border rounded-xl text-sm outline-none font-mono"
                            placeholder="0.00"
                          />
                        </div>
                        {payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePayer(index)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {payments.length < members.length && (
                    <button
                      type="button"
                      onClick={addPayer}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 py-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t('expenses.add_payer')}
                    </button>
                  )}
                  
                  {!isAmountValid && (
                    <p className="text-red-500 text-xs mt-1">
                      {t('expenses.total_amount_mismatch', { 
                        diff: (parseFloat(amount || '0') - totalPaid).toFixed(2) 
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t('expenses.split_among')}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={toggleCustomSplit}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                  >
                    {isCustomSplit ? t('expenses.equal_split') : t('expenses.custom_split')}
                  </button>
                  {!isCustomSplit && (
                    <button type="button" onClick={() => setSplitAmong(isAllSelected ? [] : members.map(m =>
                      m.id))}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                    >
                      {isAllSelected ? (i18n.language.startsWith('zh') ? '全不選' : 'Unselect All') : t('expenses.select_all')}
                    </button>
                  )}
                </div>
              </div>

              {isCustomSplit ? (
                <div className="space-y-2 mb-4">
                  {members.map((m) => {
                    const split = splits.find(s => s.memberId === m.id) || { memberId: m.id, amount: 0 };
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <div className="flex-1 text-sm text-gray-700 truncate">{m.name}</div>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            step="any"
                            value={split.amount || ''}
                            onChange={(e) => updateSplitAmount(m.id, parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-3 py-2 border rounded-xl text-sm outline-none font-mono"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!isSplitValid && (
                    <p className="text-red-500 text-xs mt-1">
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
                      <button key={m.id} type="button" onClick={() => toggleSplitMember(m.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm
                        transition-colors text-left ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {isSelected &&
                            <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {splitAmong.length === 0 && (
                <p className="text-red-500 text-xs mt-1">{i18n.language.startsWith('zh') ? '請至少選擇一位分帳成員' : 'Please select at least one member'}</p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t">
            <button type="submit" disabled={!description || !amount || splitAmong.length === 0 || !isAmountValid || !isSplitValid}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors">
              {isEditing ? t('common.save') : t('common.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
