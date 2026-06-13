import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  Languages, CheckCircle2, Shield, Users,
  Receipt, DollarSign, Loader2, Sparkles, Smartphone, UserCircle,
  LogIn, Link2, Calculator, ChevronDown
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
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const isZh = i18n.resolvedLanguage?.startsWith('zh');

  const toggleFaq = (idx: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

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

  const steps = [
    {
      icon: <LogIn className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '立即登入' : 'Sign in',
      desc: isZh
        ? '訪客模式秒進，也可用 Google 登入。免填表單、免設密碼。'
        : 'Continue as guest or sign in with Google — no email, no password, no signup form.'
    },
    {
      icon: <Link2 className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '分享群組連結' : 'Share a group',
      desc: isZh
        ? '建立群組、複製邀請連結，朋友點擊即可加入。免安裝任何 App。'
        : 'Create a group, copy the invite link, and your friends are in. No app install required.'
    },
    {
      icon: <Calculator className="w-6 h-6 text-accent-orange stroke-[2.5]" />,
      title: isZh ? '記帳、智慧結算' : 'Add expenses & settle',
      desc: isZh
        ? '輸入支出後，SLICE 自動算出最佳結算方式，最少次轉帳即可清帳。'
        : 'Log who paid, who owes. SLICE finds the minimum transfers to clear all balances.'
    }
  ];

  const faqs = isZh ? [
    {
      q: 'SLICE 真的免費嗎？',
      a: 'SLICE 完全免費供個人使用，沒有廣告，也沒有付費版本。'
    },
    {
      q: '需要註冊帳號嗎？',
      a: '不需要。訪客模式可直接開始使用，資料儲存於本機，日後想保留紀錄時再連結 Google 帳號即可。'
    },
    {
      q: '可以不平均分攤嗎？',
      a: '可以。每筆支出都支援自訂分攤金額、百分比分攤，並支援多人共同付款的情境。'
    },
    {
      q: '朋友要怎麼加入我的群組？',
      a: '從群組頁面複製專屬邀請連結傳送即可，朋友點擊就能加入，無需事先註冊帳號。'
    },
    {
      q: '我的資料安全嗎？',
      a: '群組資料儲存於 Google Firebase，僅您邀請的成員可存取。我們不出售、不分享您的資料，詳見隱私權政策。'
    }
  ] : [
    {
      q: 'Is SLICE free?',
      a: 'Yes — SLICE is completely free for personal use, with no ads and no premium tier.'
    },
    {
      q: 'Do I need to register?',
      a: 'No. Guest mode works instantly — your data lives on this device until you choose to link a Google account.'
    },
    {
      q: 'Can I split expenses unevenly?',
      a: 'Yes. Set custom amounts per person, or split by percentage. Multi-payer expenses are supported too.'
    },
    {
      q: 'How do friends join my group?',
      a: "Share the unique invite link from the group page. They click and they're in — no SLICE account required up front."
    },
    {
      q: 'Is my data private?',
      a: "Your group data is stored on Google Firebase, accessible only to members you invite. We don't sell or share it. See our privacy policy."
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
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

      {/* How It Works */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 border-t-2 border-dashed border-main-text/10 relative z-10">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-nunito font-black text-main-text">
            {isZh ? '三步驟，輕鬆結清' : 'Three steps to settle up'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {isZh ? '從建立群組到完成結算，整個流程不到三分鐘。' : 'From group to settled in under three minutes.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative bg-white p-6 rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] space-y-4"
            >
              <div className="absolute -top-5 -left-3 w-12 h-12 bg-accent-orange text-white rounded-full border-3 border-main-text flex items-center justify-center font-nunito font-black text-xl rotate-[-6deg] shadow-[3px_3px_0px_#1A1A2E]">
                {idx + 1}
              </div>
              <div className="w-12 h-12 bg-brand-light border-2 border-main-text rounded-xl flex items-center justify-center rotate-[-3deg] shadow-[2px_2px_0px_#1A1A2E] shrink-0 ml-auto">
                {step.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-nunito font-black text-lg text-main-text">{step.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 border-t-2 border-dashed border-main-text/10 relative z-10">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-nunito font-black text-main-text">
            {isZh ? '常見問題' : 'Frequently asked questions'}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {isZh ? '使用 SLICE 之前，先看看大家最常問的問題。' : 'The questions people ask most before getting started.'}
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map(({ q, a }, idx) => {
            const isOpen = openFaqs.has(idx);
            const panelId = `faq-panel-${idx}`;
            const buttonId = `faq-button-${idx}`;
            return (
              <div
                key={idx}
                className="bg-white rounded-[18px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] overflow-hidden"
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left cursor-pointer hover:bg-brand-light/40 transition-colors"
                >
                  <h3 className="font-nunito font-black text-base md:text-lg text-main-text leading-snug">{q}</h3>
                  <span className={`shrink-0 w-9 h-9 bg-brand-light border-2 border-main-text rounded-full flex items-center justify-center shadow-[2px_2px_0px_#1A1A2E] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-accent-orange stroke-[3]" />
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-gray-500 font-medium leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
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

        <div className="flex items-center gap-4 text-[10px] font-bold tracking-wider uppercase">
          <Link to="/privacy" className="text-main-text/50 hover:text-accent-orange transition-colors no-underline">
            {isZh ? '隱私權' : 'Privacy'}
          </Link>
          <span className="text-main-text/20">·</span>
          <Link to="/terms" className="text-main-text/50 hover:text-accent-orange transition-colors no-underline">
            {isZh ? '服務條款' : 'Terms'}
          </Link>
        </div>
      </footer>
      {isSponsorOpen && <SponsorModal onClose={() => setIsSponsorOpen(false)} />}
    </div>
    </>
  );
}
