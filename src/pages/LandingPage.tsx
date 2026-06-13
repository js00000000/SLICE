import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Languages, CheckCircle2, Shield, Users,
  Receipt, DollarSign, Loader2, Sparkles, Smartphone, UserCircle
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { CountUp } from '../components/CountUp';
import { SponsorModal } from '../components/SponsorModal';

interface LandingPageProps {
  onGoogleLogin: () => void;
  onQuickStart: () => void;
  isGoogleLoading?: boolean;
  isGuestLoading?: boolean;
}

export function LandingPage({
  onGoogleLogin,
  onQuickStart,
  isGoogleLoading = false,
  isGuestLoading = false
}: LandingPageProps) {
  const { t, i18n } = useTranslation();
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);
  const isZh = i18n.resolvedLanguage?.startsWith('zh');

  const toggleLanguage = () => {
    const newLang = isZh ? 'en' : 'zh-TW';
    i18n.changeLanguage(newLang);
  };

  const isAnyLoading = isGoogleLoading || isGuestLoading;

  const features = [
    {
      icon: <Receipt className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '快速記帳分帳' : 'Fast Split-Billing',
      desc: isZh ? '一秒登錄消費金額與品項，多重付款人也支援。' : 'Log amounts and items in one second. Multi-payer supported.'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '最優化結清演算法' : 'Smart Settlements',
      desc: isZh ? '自動算出最佳的結算關係，減少朋友間多次轉帳。' : 'Minimize transfers with our optimized settlement engine.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '完美行動優先體驗' : 'Responsive RWD',
      desc: isZh ? '精心雕琢的手機網頁介面，無 auto-zoom 困擾。' : 'Exquisite mobile UI with zero iOS auto-zoom issues.'
    },
    {
      icon: <Users className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '簡單好用的群組分享' : 'Instant Group Share',
      desc: isZh ? '一鍵複製專屬邀請連結，朋友點擊即刻加入群組。' : 'Copy invite link with one click, friends join instantly.'
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta flex flex-col relative overflow-hidden pb-12">
      {/* Premium Backdrop Ornament Details */}
      <div className="absolute top-12 left-12 w-64 h-64 bg-brand-light rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-32 right-12 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

      {/* Floating Decorative Grid lines for a precise visual blueprint feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A1A2E05_1px,transparent_1px),linear-gradient(to_bottom,#1A1A2E05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between shrink-0 relative z-10 border-b-2 border-dashed border-main-text/10">
        <div className="flex items-center gap-2">
          {/* Logo with diagonal diagonal cut */}
          <div className="w-10 h-10 bg-accent-orange text-white rounded-xl border-3 border-main-text flex items-center justify-center font-nunito font-black text-md relative rotate-[-4deg] shadow-[3px_3px_0px_#1A1A2E]">
            <span className="scale-95 italic">S/</span>
          </div>
          <span className="font-nunito font-black text-2xl tracking-tight text-main-text">{APP_NAME}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-accent-orange bg-brand-light px-3.5 py-2 rounded-full border-2 border-main-text hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Languages className="w-4 h-4 stroke-[2.5]" />
            {isZh ? 'English' : '繁體中文'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">

        {/* Left Column: Bold Copywriting & Pure-CSS App Preview Mockup */}
        <div className="lg:col-span-7 space-y-12">

          {/* Slogan details */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-light border-2 border-main-text rounded-full shadow-[2px_2px_0px_#1A1A2E] rotate-[-1.5deg]">
              <Sparkles className="w-4 h-4 text-accent-orange fill-accent-orange/10 animate-pulse" />
              <span className="text-xs font-black uppercase font-nunito tracking-wider text-accent-orange">
                {isZh ? '朋友出遊 ‧ 聚餐分帳神器' : 'Smarter Split Billing'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5.5xl lg:text-6xl font-nunito font-black text-main-text leading-[1.08] tracking-tight">
              {isZh ? (
                <>
                  輕鬆計算每一分錢，<br />
                  朋友出遊 <span className="text-accent-orange underline decoration-wavy decoration-3 underline-offset-8">不再尷尬</span>。
                </>
              ) : (
                <>
                  Group expense sharing,<br />
                  made <span className="text-accent-orange underline decoration-wavy decoration-3 underline-offset-8">effortless</span>.
                </>
              )}
            </h1>

            <p className="text-gray-500 font-medium text-base md:text-lg max-w-xl">
              {isZh
                ? 'SLICE 主打「快速、簡單、趣味」的朋友分帳情境。無需複雜註冊，一秒建立群組、紀錄帳目、智慧結算，讓歡樂時光不因算帳而掃興！'
                : 'SLICE is a playful, bold split-billing web application designed for friends, dining, and traveling. No tedious registration required—get started in seconds.'}
            </p>
          </div>

          {/* Pure-CSS Interactive Mobile Preview Mockup */}
          <div className="hidden sm:block relative max-w-md bg-white border-3 border-main-text rounded-[28px] shadow-[8px_8px_0px_#1A1A2E] p-5 rotate-[1.5deg] overflow-hidden">
            {/* Wavy diagonal stripe background pattern inside preview for high quality */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-light rounded-bl-full pointer-events-none opacity-40 border-l border-b border-dashed border-main-text/10" />

            <div className="flex items-center justify-between border-b-2 border-dashed border-main-text/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-accent-orange rounded-full animate-ping" />
                <span className="font-nunito font-black text-base text-main-text">
                  {isZh ? '日本東京之旅 🇯🇵' : 'Trip to Tokyo 🇯🇵'}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-accent-orange bg-brand-light border border-accent-orange/15 px-2 py-0.5 rounded-full">
                {isZh ? '進行中' : 'Active'}
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Mockup Expense 1 */}
              <div className="flex justify-between items-center p-3 border-2 border-main-text rounded-xl bg-page-bg/40 shadow-[2px_2px_0px_#1A1A2E]">
                <div>
                  <div className="font-bold text-sm text-main-text">{isZh ? '築地市場海鮮 🍣' : 'Tsukiji Fish Market 🍣'}</div>
                  <div className="text-[10px] text-gray-400 font-bold font-nunito mt-0.5">{isZh ? 'Jason 先付了' : 'Jason paid'} $3,200</div>
                </div>
                <div className="text-right">
                  <span className="font-nunito font-black text-xs text-accent-orange bg-brand-light border border-accent-orange/15 px-2 py-0.5 rounded-md">
                    {isZh ? '我的分攤: ' : 'My Share: '} <CountUp value={1600} formatter={(v) => `$${v.toFixed(0)}`} className="font-black" />
                  </span>
                </div>
              </div>

              {/* Mockup Expense 2 */}
              <div className="flex justify-between items-center p-3 border-2 border-main-text rounded-xl bg-page-bg/40 shadow-[2px_2px_0px_#1A1A2E]">
                <div>
                  <div className="font-bold text-sm text-main-text">{isZh ? '新幹線票根 🚄' : 'Shinkansen Ticket 🚄'}</div>
                  <div className="text-[10px] text-gray-400 font-bold font-nunito mt-0.5">{isZh ? 'Zayn 先付了' : 'Zayn paid'} $4,800</div>
                </div>
                <div className="text-right">
                  <span className="font-nunito font-black text-xs text-accent-orange bg-brand-light border border-accent-orange/15 px-2 py-0.5 rounded-md">
                    {isZh ? '我的分攤: ' : 'My Share: '} <CountUp value={2400} formatter={(v) => `$${v.toFixed(0)}`} className="font-black" />
                  </span>
                </div>
              </div>

              {/* Settlement Preview */}
              <div className="p-3 border-2 border-dashed border-main-text/20 bg-success-light/40 rounded-xl flex items-center justify-between">
                <span className="text-xs font-black text-success-green flex items-center gap-1.5 font-nunito">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  {isZh ? '最佳建議結帳關係：' : 'Optimal Settlement Link:'}
                </span>
                <span className="text-xs font-bold text-main-text bg-white border border-main-text/10 px-2 py-0.5 rounded-md font-nunito">
                  Jason ➔ Zayn $400
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Styled Tactile 3D Login Widget Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-[24px] border-3 border-main-text p-8 space-y-6 relative shadow-[8px_8px_0px_#1A1A2E] transform transition-transform duration-300">

            {/* Login widget header */}
            <div className="text-center space-y-3 border-b-2 border-dashed border-main-text/10 pb-4">
              <p className="text-2.5xl font-nunito font-black text-main-text leading-tight">
                {t('auth.login_title') || 'SLICE Application'}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {t('auth.login_subtitle') || 'Quick & Simple Split Billing'}
              </p>
            </div>

            {/* Login buttons with 3D tactile borders */}
            <div className="space-y-4">

              {/* Google Login */}
              <button
                onClick={onGoogleLogin}
                disabled={isAnyLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-main-text rounded-xl font-nunito font-black text-main-text hover:bg-brand-light shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-accent-orange" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                )}
                <span className="text-sm font-black">{t('auth.google_login')}</span>
              </button>

              <div className="relative flex py-1 items-center justify-center">
                <div className="flex-grow border-t border-dashed border-gray-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-black text-gray-400 font-nunito tracking-widest uppercase">
                  {t('common.or') || 'OR'}
                </span>
                <div className="flex-grow border-t border-dashed border-gray-200"></div>
              </div>

              {/* Guest / Direct login */}
              <button
                onClick={onQuickStart}
                disabled={isAnyLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-accent-orange text-white border-2 border-main-text rounded-xl font-nunito font-black text-md hover:bg-[#ff7b4b] shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
              >
                {isGuestLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserCircle className="w-5 h-5" />
                )}
                <span className="text-base font-black">{t('auth.quick_start')}</span>
              </button>
            </div>

            {/* Secure warning badge footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs font-bold text-main-text/60">
              <Shield className="w-4 h-4 text-accent-orange stroke-[2.5]" />
              <span>{isZh ? 'Google 加密登入 ‧ 安全可靠' : 'Secure Encrypted Login'}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid Segment */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 border-t-2 border-dashed border-main-text/10 relative z-10">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-nunito font-black text-main-text">
            {isZh ? '簡單。強大。專為出遊打造。' : 'Simple. Mighty. Built for Traveling.'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {isZh ? '不再為了「誰該付多少錢」大傷腦筋，一切交給 SLICE 搞定！' : 'Let SLICE handle the hard math so you can focus on the memories.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Feature Icon Badge */}
              <div className="w-12 h-12 bg-brand-light border-2 border-main-text rounded-xl flex items-center justify-center rotate-[-3deg] shadow-[2px_2px_0px_#1A1A2E] shrink-0">
                {feat.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-nunito font-black text-base text-main-text">{feat.title}</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl mx-auto px-6 pt-10 border-t border-dashed border-main-text/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black text-main-text/40 font-nunito tracking-wide shrink-0">
        <span>© {new Date().getFullYear()} {APP_NAME}. ALL RIGHTS RESERVED.</span>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Playful Sponsor Link inside Footer */}
          <button
            onClick={() => setIsSponsorOpen(true)}
            className="text-white bg-accent-orange px-4 py-2 border-2 border-main-text rounded-full hover:bg-[#ff7b4b] hover:text-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] inline-flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <span className="animate-pulse">💖</span>
            <span>{t('profile.sponsor_btn')}</span>
          </button>

          {/* Playful Feedback Link inside Footer */}
          <a
            href="https://forms.gle/CWqJBPzSQ2TbTfgy7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-orange bg-brand-light px-4 py-2 border-2 border-main-text rounded-full hover:bg-white transition-all duration-150 hover:scale-105 active:scale-95 shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] inline-flex items-center gap-1.5 font-bold no-underline"
          >
            <span>💬 {t('profile.feedback_btn')}</span>
          </a>
        </div>

        <span>MADE WITH ❤️ FOR AWESOME TRAVELS</span>
      </footer>
      {isSponsorOpen && <SponsorModal onClose={() => setIsSponsorOpen(false)} />}
    </div>
  );
}
