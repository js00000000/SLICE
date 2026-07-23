import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { firebaseService } from '../lib/firebaseService';
import { AppHeader } from '../components/AppHeader';
import { LoadingView } from '../components/LoadingView';
import { APP_NAME } from '../constants';

export function GroupBindPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { myGroups, isLoading } = useGroup();

  // 僅篩選目前使用者為「主辦人」的群組
  const hostGroups = myGroups.filter((g) => g.createdBy === user?.uid);

  const lineGroupId = searchParams.get('lineGroupId');
  const [bindingGroupId, setBindingGroupId] = useState<string | null>(null);

  // Manual title fallback
  useEffect(() => {
    document.title = `綁定 LINE 群組 - ${APP_NAME}`;
  }, []);

  const handleBind = async (groupId: string, groupName: string) => {
    if (!lineGroupId) {
      toast.error('缺少 LINE 群組 ID，無法進行綁定');
      return;
    }

    setBindingGroupId(groupId);
    try {
      await firebaseService.updateGroupLineGroupId(groupId, lineGroupId);
      toast.success(`成功綁定 ${groupName} 到 LINE 群組！`);
      
      // 成功後跳轉回群組儀表板
      setTimeout(() => {
        navigate(`/group/${groupId}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to bind group:', err);
      toast.error('綁定失敗，請重試');
      setBindingGroupId(null);
    }
  };

  const isZh = i18n.resolvedLanguage?.startsWith('zh');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <LoadingView />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta flex flex-col pb-10">
      <Helmet>
        <title>綁定 LINE 群組 - {APP_NAME}</title>
      </Helmet>

      <AppHeader
        showProfile={false}
        currentMemberName={user?.displayName || user?.email || (isZh ? '使用者' : 'User')}
      />

      <main className="w-full max-w-md mx-auto p-5 py-6 space-y-6 flex-1 flex flex-col justify-start">
        {/* Header Section */}
        <div className="stagger-item space-y-1 py-2 text-center" style={{ animationDelay: '0ms' }}>
          <div className="w-12 h-12 rounded-full bg-brand-light border-2 border-main-text flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_#1A1A2E]">
            <Link2 className="w-6 h-6 text-accent-orange stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-nunito font-black text-main-text tracking-tight">
            {isZh ? '綁定 LINE 群組' : 'Bind LINE Group'}
          </h1>
          <p className="text-xs text-gray-500 font-medium px-4">
            {isZh 
              ? '請選擇一個現有的 SLICE 群組來連結此 LINE 聊天室，以便自動發送結算明細通知。' 
              : 'Choose a SLICE group to link with this LINE chat room for automatic notifications.'}
          </p>
        </div>

        {/* Warning card if missing lineGroupId */}
        {!lineGroupId && (
          <div className="stagger-item bg-red-50 border-3 border-main-text rounded-[24px] p-5 shadow-[4px_4px_0px_#1A1A2E] flex gap-3 items-start" style={{ animationDelay: '60ms' }}>
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 stroke-[2.5]" />
            <div className="space-y-1">
              <h3 className="font-nunito font-black text-sm text-main-text">
                {isZh ? '偵測不到 LINE 群組資訊' : 'No LINE Group ID Detected'}
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                {isZh
                  ? '請確保您是從 LINE 群組中，點選機器人發送的連結進入此頁面。'
                  : 'Please make sure you clicked the link sent by the bot inside your LINE group.'}
              </p>
            </div>
          </div>
        )}

        {/* Group selection list */}
        {lineGroupId && (
          <div className="stagger-item bg-white rounded-[24px] border-3 border-main-text p-6 shadow-[4px_4px_0px_#1A1A2E] space-y-4" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-1.5 border-b-2 border-dashed border-main-text/10 pb-2">
              <span className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
              <h2 className="font-nunito font-black text-md text-main-text uppercase tracking-wider">
                {isZh ? '我的群組清單' : 'My Groups'}
              </h2>
            </div>

            {hostGroups.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-gray-500 font-medium">
                  {isZh 
                    ? '您目前沒有擔任主辦人的群組（僅主辦人可進行 LINE 群組綁定）。' 
                    : 'You do not host any groups yet (only the host can bind a LINE group).'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 border-2 border-main-text rounded-xl bg-accent-orange text-white font-nunito font-black shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] text-sm cursor-pointer"
                >
                  {isZh ? '前往建立群組' : 'Go Create Group'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {hostGroups.map((g) => {
                  const isBinding = bindingGroupId === g.id;
                  const isAlreadyBound = g.lineGroupId === lineGroupId;

                  return (
                    <button
                      key={g.id}
                      disabled={isBinding || isAlreadyBound}
                      onClick={() => handleBind(g.id, g.name)}
                      className={`w-full flex items-center justify-between p-4 border-2 border-main-text rounded-xl transition-all shadow-[3px_3px_0px_#1A1A2E] group cursor-pointer ${
                        isAlreadyBound
                          ? 'bg-success-light/40 border-success-green/30 text-success-green cursor-not-allowed shadow-[1px_1px_0px_#1A1A2E] translate-x-[2px] translate-y-[2px]'
                          : 'bg-white hover:bg-brand-light active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#1A1A2E]'
                      }`}
                    >
                      <div className="flex flex-col items-start min-w-0 pr-2">
                        <span className="font-nunito font-black text-base text-main-text truncate group-hover:text-accent-orange transition-colors">
                          {g.name}
                        </span>
                        {g.lineGroupId && (
                          <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {isAlreadyBound 
                              ? (isZh ? '✓ 已綁定此 LINE 群組' : '✓ Bound to this LINE group')
                              : (isZh ? '⚠ 已綁定其他 LINE 群組' : '⚠ Bound to another LINE group')}
                          </span>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-brand-light border border-main-text/15 flex items-center justify-center group-hover:bg-accent-orange group-hover:text-white transition-colors shrink-0">
                        {isAlreadyBound ? (
                          <CheckCircle2 className="w-4 h-4 text-success-green stroke-[2.5]" />
                        ) : (
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Back button */}
        <div className="stagger-item text-center" style={{ animationDelay: '120ms' }}>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-500 underline font-medium hover:text-main-text cursor-pointer"
          >
            {isZh ? '返回首頁' : 'Back to Home'}
          </button>
        </div>
      </main>
    </div>
  );
}
