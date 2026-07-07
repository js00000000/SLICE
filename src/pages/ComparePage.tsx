import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Minus } from 'lucide-react';
import { APP_NAME } from '../constants';

const DATA_AS_OF_ZH = '2026 年 7 月';
const DATA_AS_OF_EN = 'July 2026';
const PAGE_PATH = '/compare/splitwise';
const PAGE_URL = `https://slice.fusion-labs.cc${PAGE_PATH}`;

interface CompareRow {
  feature: string;
  slice: string;
  sliceGood: boolean;
  splitwise: string;
  splitwiseGood: boolean;
}

interface CompareFaq {
  q: string;
  a: string;
}

interface CompareContent {
  title: string;
  subtitle: string;
  description: string;
  intro: string[];
  tableCaption: string;
  rows: CompareRow[];
  whenSliceTitle: string;
  whenSlice: string[];
  whenSplitwiseTitle: string;
  whenSplitwise: string[];
  faqTitle: string;
  faqs: CompareFaq[];
  cta: string;
  disclaimer: string;
}

export function ComparePage() {
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
        '@type': 'FAQPage',
        mainEntity: content.faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a }
        }))
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

          {/* Comparison table */}
          <div className="overflow-x-auto -mx-2 px-2 mb-4">
            <table className="w-full min-w-[520px] border-collapse">
              <caption className="sr-only">{content.tableCaption}</caption>
              <thead>
                <tr>
                  <th className="text-left text-xs font-black uppercase tracking-wider text-main-text/50 font-nunito pb-3 pr-3 w-[34%]" />
                  <th className="text-left pb-3 pr-3 w-[33%]">
                    <span className="inline-flex items-center gap-1.5 bg-accent-orange text-white text-sm font-nunito font-black px-3 py-1.5 rounded-lg border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E]">
                      SLICE
                    </span>
                  </th>
                  <th className="text-left pb-3 w-[33%]">
                    <span className="inline-flex items-center gap-1.5 bg-page-bg text-main-text text-sm font-nunito font-black px-3 py-1.5 rounded-lg border-2 border-main-text">
                      Splitwise
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {content.rows.map((row, i) => (
                  <tr key={i} className="border-t-2 border-dashed border-main-text/10">
                    <th scope="row" className="text-left text-sm font-black text-main-text py-3.5 pr-3 align-top">
                      {row.feature}
                    </th>
                    <td className="text-sm font-semibold text-main-text/85 py-3.5 pr-3 align-top">
                      <span className="flex items-start gap-1.5">
                        {row.sliceGood
                          ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-success-green stroke-[3]" />
                          : <Minus className="w-4 h-4 mt-0.5 shrink-0 text-main-text/30 stroke-[3]" />}
                        {row.slice}
                      </span>
                    </td>
                    <td className="text-sm font-semibold text-main-text/70 py-3.5 align-top">
                      <span className="flex items-start gap-1.5">
                        {row.splitwiseGood
                          ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-success-green stroke-[3]" />
                          : <Minus className="w-4 h-4 mt-0.5 shrink-0 text-main-text/30 stroke-[3]" />}
                        {row.splitwise}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs font-semibold text-main-text/50 leading-relaxed mb-10">
            {content.disclaimer}
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-nunito font-black text-main-text mb-3">{content.whenSliceTitle}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-main-text/85 font-medium">
              {content.whenSlice.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-nunito font-black text-main-text mb-3">{content.whenSplitwiseTitle}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-main-text/85 font-medium">
              {content.whenSplitwise.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-nunito font-black text-main-text mb-4">{content.faqTitle}</h2>
            <div className="space-y-4">
              {content.faqs.map(({ q, a }, i) => (
                <div key={i} className="bg-page-bg border-2 border-main-text rounded-2xl p-4">
                  <h3 className="text-[15px] font-nunito font-black text-main-text mb-1.5">{q}</h3>
                  <p className="text-sm font-medium text-main-text/80 leading-relaxed">{a}</p>
                </div>
              ))}
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

function getContent(isZh: boolean): CompareContent {
  if (isZh) {
    return {
      title: 'SLICE vs Splitwise',
      subtitle: '分帳工具比較',
      description:
        '正在找 Splitwise 的免費替代方案？比較 SLICE 與 Splitwise：價格、廣告、註冊門檻、多幣別、記帳限制，幫你挑對群組分帳工具。',
      intro: [
        'Splitwise 是最知名的分帳 App 之一，但近年免費版加入了廣告與每日記帳上限，不少功能移到付費的 Pro 方案。',
        'SLICE 是完全免費的網頁版群組分帳工具：不用下載、不用註冊，開網頁就能開始記帳。這一頁誠實比較兩者的差異，幫你判斷哪一個適合你的情境。'
      ],
      tableCaption: 'SLICE 與 Splitwise 功能比較表',
      rows: [
        { feature: '價格', slice: '完全免費，無付費方案', sliceGood: true, splitwise: '免費版＋ Pro 訂閱制', splitwiseGood: false },
        { feature: '廣告', slice: '無廣告', sliceGood: true, splitwise: '免費版有廣告', splitwiseGood: false },
        { feature: '註冊門檻', slice: '免註冊，訪客模式秒開', sliceGood: true, splitwise: '需要建立帳號', splitwiseGood: false },
        { feature: '記帳次數', slice: '無限制', sliceGood: true, splitwise: '免費版有每日輸入上限', splitwiseGood: false },
        { feature: '多幣別', slice: '免費支援，群組自訂匯率', sliceGood: true, splitwise: '換匯屬 Pro 功能', splitwiseGood: false },
        { feature: '最少轉帳結算', slice: '內建自動計算', sliceGood: true, splitwise: '支援（簡化債務）', splitwiseGood: true },
        { feature: '朋友加入方式', slice: '點邀請連結即可，無需帳號', sliceGood: true, splitwise: '成員需註冊帳號', splitwiseGood: false },
        { feature: '使用方式', slice: '網頁直接用，可加入主畫面（PWA）', sliceGood: true, splitwise: '原生 App（iOS／Android）＋網頁版', splitwiseGood: true },
        { feature: '介面語言', slice: '繁體中文、英文', sliceGood: true, splitwise: '多國語言', splitwiseGood: true }
      ],
      whenSliceTitle: '什麼時候選 SLICE？',
      whenSlice: [
        '短期出遊、聚餐、臨時成團的分帳，SLICE 幾乎沒有起步成本：開群組、把連結丟進 LINE 群，朋友點開就能記帳——不用逼每個人下載 App、註冊帳號。',
        '出國旅遊會用到多種幣別時，SLICE 的多幣別與自訂匯率是免費功能；記帳次數也沒有上限，旅途中密集記帳不會卡住。',
        '結束後，內建的最少轉帳結算會直接告訴每個人「誰轉給誰、轉多少」，一次清空。'
      ],
      whenSplitwiseTitle: '什麼時候 Splitwise 可能更適合？',
      whenSplitwise: [
        '如果你需要長期（跨年度）的帳務追蹤、收據掃描、或與室友之間的固定循環帳單，Splitwise 的 Pro 方案有更完整的進階功能，原生 App 的離線體驗也更成熟。',
        '兩者並不衝突：不少人固定帳目用 Splitwise、臨時出遊用 SLICE。'
      ],
      faqTitle: '常見問題',
      faqs: [
        {
          q: 'SLICE 真的完全免費嗎？',
          a: '是。SLICE 沒有付費方案、沒有廣告、沒有記帳次數限制，由獨立開發者維護，僅接受自願性質的贊助。'
        },
        {
          q: '可以把 Splitwise 的資料匯入 SLICE 嗎？',
          a: '目前沒有自動匯入功能。建議把 Splitwise 上未結清的帳先結掉，新的行程直接在 SLICE 開新群組記帳。'
        },
        {
          q: '不註冊的話，我的資料會不見嗎？',
          a: '不會。訪客模式會建立匿名帳號，資料儲存在雲端（Google Firebase）；想跨裝置保留紀錄時，隨時可以升級連結 Google 帳號，資料會完整保留。'
        }
      ],
      cta: '免費開始分帳',
      disclaimer:
        `Splitwise 相關描述以 ${DATA_AS_OF_ZH}的公開資訊為準，其功能與定價可能變動，請以官方網站為準。Splitwise 為其權利人之商標；本站為獨立專案，與 Splitwise 無任何關聯。`
    };
  }
  return {
    title: 'SLICE vs Splitwise',
    subtitle: 'Bill-splitting comparison',
    description:
      'Looking for a free Splitwise alternative? Compare SLICE and Splitwise on pricing, ads, sign-up friction, multi-currency, and expense limits.',
    intro: [
      'Splitwise is one of the best-known bill-splitting apps, but its free tier now includes ads and a daily expense-entry limit, with several features moved behind the Pro subscription.',
      'SLICE is a completely free, web-based group expense splitter: nothing to download, no account required — open the page and start logging. Here is an honest comparison to help you pick the right tool for your situation.'
    ],
    tableCaption: 'Feature comparison between SLICE and Splitwise',
    rows: [
      { feature: 'Pricing', slice: 'Completely free, no paid tier', sliceGood: true, splitwise: 'Free tier + Pro subscription', splitwiseGood: false },
      { feature: 'Ads', slice: 'No ads', sliceGood: true, splitwise: 'Ads on the free tier', splitwiseGood: false },
      { feature: 'Sign-up', slice: 'None — guest mode starts instantly', sliceGood: true, splitwise: 'Account required', splitwiseGood: false },
      { feature: 'Expense entries', slice: 'Unlimited', sliceGood: true, splitwise: 'Daily limit on the free tier', splitwiseGood: false },
      { feature: 'Multi-currency', slice: 'Free, with per-group custom rates', sliceGood: true, splitwise: 'Currency conversion is a Pro feature', splitwiseGood: false },
      { feature: 'Minimal-transfer settlement', slice: 'Built in, automatic', sliceGood: true, splitwise: 'Supported (simplify debts)', splitwiseGood: true },
      { feature: 'How friends join', slice: 'Tap an invite link — no account needed', sliceGood: true, splitwise: 'Members need to register', splitwiseGood: false },
      { feature: 'Platform', slice: 'Web, installable to home screen (PWA)', sliceGood: true, splitwise: 'Native apps (iOS/Android) + web', splitwiseGood: true },
      { feature: 'Languages', slice: 'Traditional Chinese, English', sliceGood: true, splitwise: 'Many languages', splitwiseGood: true }
    ],
    whenSliceTitle: 'When to pick SLICE',
    whenSlice: [
      'For trips, dinners, and ad-hoc groups, SLICE has almost zero startup cost: create a group, drop the invite link into your chat, and friends start logging right away — no one has to install an app or create an account.',
      'Traveling across currencies? Multi-currency with custom exchange rates is free in SLICE, and there is no cap on how many expenses you log.',
      'When the trip ends, the built-in minimal-transfer settlement tells everyone exactly who pays whom, and how much, to clear all balances at once.'
    ],
    whenSplitwiseTitle: 'When Splitwise may fit better',
    whenSplitwise: [
      'If you need long-running, multi-year ledgers, receipt scanning, or recurring bills with roommates, Splitwise Pro offers more advanced features, and its native apps have a more mature offline experience.',
      'The two are not mutually exclusive — plenty of people keep Splitwise for recurring household bills and use SLICE for one-off trips.'
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'Is SLICE really completely free?',
        a: 'Yes. SLICE has no paid tier, no ads, and no limits on expense entries. It is maintained by an independent developer and funded only by voluntary sponsorship.'
      },
      {
        q: 'Can I import my Splitwise data into SLICE?',
        a: 'There is no automatic import at the moment. We recommend settling outstanding balances in Splitwise first, then starting fresh groups in SLICE for new trips.'
      },
      {
        q: "If I don't register, will I lose my data?",
        a: 'No. Guest mode creates an anonymous account and your data is stored in the cloud (Google Firebase). You can link a Google account at any time to keep your records across devices — nothing is lost when you upgrade.'
      }
    ],
    cta: 'Start splitting for free',
    disclaimer:
      `Statements about Splitwise reflect publicly available information as of ${DATA_AS_OF_EN}; its features and pricing may change — check their official site. Splitwise is a trademark of its owner; this site is an independent project not affiliated with Splitwise.`
  };
}
