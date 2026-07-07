import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { APP_NAME } from '../constants';

const PAGE_PATH = '/about';
const PAGE_URL = `https://slice.fusion-labs.cc${PAGE_PATH}`;
const CONTACT_EMAIL = 'fusion.labs.tw@gmail.com';
const FEEDBACK_URL = 'https://forms.gle/CWqJBPzSQ2TbTfgy7';

interface Section {
  h: string;
  body: string[];
}

interface AboutContent {
  title: string;
  subtitle: string;
  description: string;
  intro: string[];
  sections: Section[];
  principlesTitle: string;
  principles: { h: string; p: string }[];
  contactTitle: string;
  contactBody: string;
  contactJoiner: string;
  feedbackLabel: string;
  compareLead: string;
  compareLink: string;
  cta: string;
}

export function AboutPage() {
  const { i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith('zh') ?? false;
  const lang = isZh ? 'zh-Hant-TW' : 'en';
  const content = getContent(isZh);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: APP_NAME, item: 'https://slice.fusion-labs.cc/' },
          { '@type': 'ListItem', position: 2, name: content.title, item: PAGE_URL }
        ]
      },
      {
        '@type': 'AboutPage',
        '@id': `${PAGE_URL}#page`,
        url: PAGE_URL,
        name: content.title,
        description: content.description,
        inLanguage: isZh ? 'zh-TW' : 'en',
        about: { '@id': 'https://slice.fusion-labs.cc/#app' },
        publisher: {
          '@type': 'Organization',
          '@id': 'https://slice.fusion-labs.cc/#publisher',
          name: 'Fusion Labs',
          email: CONTACT_EMAIL,
          url: 'https://slice.fusion-labs.cc/'
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-page-bg text-main-text font-plus-jakarta">
      <Helmet>
        <html lang={lang} />
        <title>{`${content.title} — ${APP_NAME}`}</title>
        <meta name="description" content={content.description} />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content={`${content.title} — ${APP_NAME}`} />
        <meta property="og:description" content={content.description} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:locale" content={isZh ? 'zh_TW' : 'en_US'} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <header className="w-full max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-black font-nunito text-main-text bg-white border-2 border-main-text rounded-full px-4 py-2 shadow-[2px_2px_0px_#1A1A2E] hover:bg-brand-light active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          {isZh ? '返回首頁' : 'Back to home'}
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-accent-orange text-white rounded-lg border-2 border-main-text flex items-center justify-center font-nunito font-black text-sm rotate-[-4deg] shadow-[2px_2px_0px_#1A1A2E]">
            <span className="scale-95 italic">S/</span>
          </div>
          <span className="font-nunito font-black text-xl tracking-tight text-main-text">{APP_NAME}</span>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-6 pt-6 pb-20">
        <div className="bg-white border-3 border-main-text rounded-[24px] shadow-[6px_6px_0px_#1A1A2E] p-6 md:p-12">
          <p className="text-xs font-black uppercase tracking-widest text-accent-orange font-nunito mb-3">
            {content.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl font-nunito font-black text-main-text leading-tight tracking-tight mb-6">
            {content.title}
          </h1>

          <div className="space-y-3 text-[15px] leading-relaxed text-main-text/85 font-medium mb-10">
            {content.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="space-y-8 mb-10">
            {content.sections.map((sec, i) => (
              <section key={i}>
                <h2 className="text-xl font-nunito font-black text-main-text mb-3">{sec.h}</h2>
                <div className="space-y-3 text-[15px] leading-relaxed text-main-text/85 font-medium">
                  {sec.body.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="text-xl font-nunito font-black text-main-text mb-4">{content.principlesTitle}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {content.principles.map(({ h, p }, i) => (
                <div key={i} className="bg-page-bg border-2 border-main-text rounded-2xl p-4">
                  <h3 className="text-[15px] font-nunito font-black text-main-text mb-1.5">{h}</h3>
                  <p className="text-sm font-medium text-main-text/80 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-nunito font-black text-main-text mb-3">{content.contactTitle}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-main-text/85 font-medium">
              <p>
                {content.contactBody}{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-orange font-bold hover:underline">
                  {CONTACT_EMAIL}
                </a>
                {content.contactJoiner}
                <a
                  href={FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-orange font-bold hover:underline"
                >
                  {content.feedbackLabel}
                </a>
              </p>
              <p>
                {content.compareLead}{' '}
                <Link to="/compare/splitwise" className="text-accent-orange font-bold hover:underline">
                  {content.compareLink}
                </Link>
              </p>
            </div>
          </section>

          <div className="text-center">
            <Link
              to="/#get-started"
              className="inline-flex items-center gap-2 bg-accent-orange text-white font-nunito font-black text-lg px-8 py-4 rounded-2xl border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] hover:bg-[#ff7b4b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all no-underline"
            >
              {content.cta}
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs font-black tracking-widest text-main-text/40 font-nunito uppercase">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </main>
    </div>
  );
}

function getContent(isZh: boolean): AboutContent {
  if (isZh) {
    return {
      title: '關於 SLICE',
      subtitle: '我們是誰、為什麼做這個',
      description:
        'SLICE 是由台灣獨立開發者打造的免費群組分帳工具。認識我們的理念：免費、無廣告、不用註冊，把分帳變回一件簡單的事。',
      intro: [
        '每次和朋友出遊，總有一個人默默扛下所有帳：先墊機票的、刷房費的、付晚餐的——回來之後對著一堆截圖和收據算「誰欠誰」。SLICE 就是為了把這件事變簡單而生的。',
        'SLICE 於 2026 年上線，是一個完全在瀏覽器裡運作的群組分帳工具：開網頁、建群組、把連結丟進聊天群，朋友點開就能一起記帳，結束時自動算出最少轉帳次數的結清方式。'
      ],
      sections: [
        {
          h: '為什麼再做一個分帳工具？',
          body: [
            '市面上的分帳 App 不少，但多數要求每個人下載 App、註冊帳號——對「一次出遊」的臨時群組來說，這個門檻常常讓大家放棄，回到手動算帳。也有工具把常用功能（例如多幣別）鎖進付費方案，或在免費版塞廣告。',
            '我們想要的是另一種答案：不用下載、不用註冊、沒有廣告、核心功能全部免費。你和朋友唯一要做的事，就是記下誰付了什麼。'
          ]
        },
        {
          h: '誰在維護 SLICE？',
          body: [
            'SLICE 由 Fusion Labs——一個位於台灣的獨立開發工作室——設計與維護。沒有創投、沒有廣告主，營運成本由開發者自行吸收，並接受使用者自願的贊助。',
            '因為是繁體中文使用者做給繁體中文使用者的工具，SLICE 從第一天就以中文介面優先設計，同時提供完整的英文版。'
          ]
        }
      ],
      principlesTitle: '我們的三個原則',
      principles: [
        { h: '免費且無廣告', p: '核心功能不收費、不放廣告、沒有每日記帳上限。' },
        { h: '資料屬於你', p: '不出售、不分享你的資料，也不放追蹤型 Cookie。詳見隱私權政策。' },
        { h: '零門檻', p: '訪客模式秒開，朋友點連結就能加入——App 與帳號都不是必需品。' }
      ],
      contactTitle: '聯絡我們',
      contactBody: '有問題、建議或合作想法？歡迎寫信到',
      contactJoiner: '，或是直接填寫',
      feedbackLabel: '意見回饋表單',
      compareLead: '想知道 SLICE 和其他工具的差異？看看',
      compareLink: 'SLICE 與 Splitwise 的完整比較',
      cta: '免費開始分帳'
    };
  }
  return {
    title: 'About SLICE',
    subtitle: 'Who we are and why we built this',
    description:
      'SLICE is a free group expense-splitting tool built by an independent developer studio in Taiwan. Free, ad-free, no sign-up — splitting bills made simple again.',
    intro: [
      "Every trip has that one friend who quietly fronts everything — the flights, the hotel, the dinners — then comes home to a pile of screenshots and receipts, working out who owes whom. SLICE exists to make that part simple.",
      'Launched in 2026, SLICE is a group expense splitter that runs entirely in the browser: open the page, create a group, drop the invite link in your chat, and everyone logs expenses together. When the trip ends, it computes the settlement plan with the fewest possible transfers.'
    ],
    sections: [
      {
        h: 'Why build another bill-splitting tool?',
        body: [
          "There are plenty of expense-splitting apps, but most require everyone to install an app and create an account — for a one-off trip group, that friction is often where people give up and go back to spreadsheets. Others lock everyday features (like multi-currency) behind a subscription, or fill the free tier with ads.",
          'We wanted a different answer: nothing to download, nothing to sign up for, no ads, and every core feature free. The only thing you and your friends should have to do is write down who paid for what.'
        ]
      },
      {
        h: 'Who maintains SLICE?',
        body: [
          'SLICE is designed and maintained by Fusion Labs, an independent developer studio based in Taiwan. There are no investors and no advertisers — running costs are absorbed by the developer, supported by voluntary sponsorship from users.',
          'Built by Traditional Chinese speakers for Traditional Chinese speakers first, SLICE ships with a full English interface as well.'
        ]
      }
    ],
    principlesTitle: 'Three principles',
    principles: [
      { h: 'Free and ad-free', p: 'Core features cost nothing, show no ads, and have no daily entry limits.' },
      { h: 'Your data is yours', p: 'We never sell or share your data, and we use no tracking cookies. See our privacy policy.' },
      { h: 'Zero friction', p: 'Guest mode starts instantly and friends join with one link — no app or account required.' }
    ],
    contactTitle: 'Contact',
    contactBody: 'Questions, suggestions, or ideas? Email us at',
    contactJoiner: ', or simply fill out the ',
    feedbackLabel: 'feedback form',
    compareLead: 'Curious how SLICE stacks up against other tools? Read the',
    compareLink: 'full SLICE vs Splitwise comparison',
    cta: 'Start splitting for free'
  };
}
