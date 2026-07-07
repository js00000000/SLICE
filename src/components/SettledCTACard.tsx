import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PartyPopper, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SettledCTACardProps {
  isHost: boolean;
  /** Stagger delay so the card slots into each page's animation sequence. */
  animationDelay?: string;
}

/**
 * Growth-loop card shown once a group is settled — the moment an invited
 * member has just experienced the full value of the app:
 * - non-hosts get a "next trip, you host" nudge to create their own group;
 * - anonymous users get a "keep your records" nudge to link Google (reusing
 *   handleGoogleLogin, which upgrades guests via linkWithPopup).
 * Renders nothing when neither applies (a signed-in host).
 */
export function SettledCTACard({ isHost, animationDelay = '80ms' }: SettledCTACardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, handleGoogleLogin, googleLoading } = useAuth();

  const showNextTrip = !isHost;
  const showUpgrade = !!user?.isAnonymous;

  if (!showNextTrip && !showUpgrade) return null;

  return (
    <div
      className="stagger-item bg-white border-3 border-main-text rounded-[24px] shadow-[4px_4px_0px_#1A1A2E] overflow-hidden"
      style={{ animationDelay }}
    >
      {showNextTrip && (
        <div className="p-5 bg-brand-light">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-accent-orange text-white border-2 border-main-text rounded-xl flex items-center justify-center rotate-[4deg] shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
              <PartyPopper className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-nunito font-black text-main-text leading-tight">
                {t('settle.next_trip_title')}
              </p>
              <p className="text-xs font-bold text-main-text/70 mt-1 leading-snug">
                {t('settle.next_trip_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent-orange text-white rounded-2xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] hover:bg-[#ff7b4b] transition-all cursor-pointer"
          >
            {t('settle.next_trip_btn')}
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

      {showUpgrade && (
        <div className={`p-5 ${showNextTrip ? 'border-t-2 border-dashed border-main-text/15' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-success-light border-2 border-main-text rounded-xl flex items-center justify-center rotate-[-4deg] shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
              <ShieldCheck className="w-5 h-5 text-success-green stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-nunito font-black text-main-text leading-tight">
                {t('settle.upgrade_title')}
              </p>
              <p className="text-xs font-bold text-main-text/70 mt-1 leading-snug">
                {t('settle.upgrade_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-main-text rounded-2xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] hover:bg-page-bg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            )}
            {t('settle.upgrade_btn')}
          </button>
        </div>
      )}
    </div>
  );
}
