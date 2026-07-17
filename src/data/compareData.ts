// Data-driven registry for the /compare/:competitor programmatic-SEO pages.
//
// Each entry is one indexable comparison page (SLICE vs a competitor). The
// generic template lives in src/pages/ComparePage.tsx and renders purely from
// the content here, so adding a competitor = add one entry below + one line in
// scripts/seo-routes.mjs (a Vitest guard in compareData.test.ts fails if the two
// drift). Every entry ships genuinely differentiated content — distinct intro,
// feature rows, "when to pick" guidance and FAQs — to stay clear of thin- and
// duplicate-content penalties. Competitor claims are deliberately hedged and
// carry a per-page, dated disclaimer.

export const DATA_AS_OF_ZH = '2026 年 7 月';
export const DATA_AS_OF_EN = 'July 2026';
export const SITE_ORIGIN = 'https://slice.fusion-labs.cc';

export interface CompareRow {
  feature: string;
  slice: string;
  sliceGood: boolean;
  competitor: string;
  competitorGood: boolean;
}

export interface CompareFaq {
  q: string;
  a: string;
}

export interface CompareContent {
  /** Competitor display name, used in the table header and cross-links. */
  competitorName: string;
  title: string;
  subtitle: string;
  description: string;
  intro: string[];
  tableCaption: string;
  rows: CompareRow[];
  whenSliceTitle: string;
  whenSlice: string[];
  whenCompetitorTitle: string;
  whenCompetitor: string[];
  faqTitle: string;
  faqs: CompareFaq[];
  cta: string;
  disclaimer: string;
}

export interface CompetitorEntry {
  slug: string;
  competitorName: string;
  zh: CompareContent;
  en: CompareContent;
}

const splitwise: CompetitorEntry = {
  slug: 'splitwise',
  competitorName: 'Splitwise',
  zh: {
    competitorName: 'Splitwise',
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
      { feature: '價格', slice: '完全免費，無付費方案', sliceGood: true, competitor: '免費版＋ Pro 訂閱制', competitorGood: false },
      { feature: '廣告', slice: '無廣告', sliceGood: true, competitor: '免費版有廣告', competitorGood: false },
      { feature: '註冊門檻', slice: '免註冊，訪客模式秒開', sliceGood: true, competitor: '需要建立帳號', competitorGood: false },
      { feature: '記帳次數', slice: '無限制', sliceGood: true, competitor: '免費版有每日輸入上限', competitorGood: false },
      { feature: '多幣別', slice: '免費支援，群組自訂匯率', sliceGood: true, competitor: '換匯屬 Pro 功能', competitorGood: false },
      { feature: '最少轉帳結算', slice: '內建自動計算', sliceGood: true, competitor: '支援（簡化債務）', competitorGood: true },
      { feature: '收據／單據掃描', slice: '手動輸入為主', sliceGood: false, competitor: 'Pro 支援掃描辨識', competitorGood: true },
      { feature: '離線使用', slice: '需連線（PWA 有基本快取）', sliceGood: false, competitor: '原生 App 離線體驗較成熟', competitorGood: true },
      { feature: '朋友加入方式', slice: '點邀請連結即可，無需帳號', sliceGood: true, competitor: '成員需註冊帳號', competitorGood: false },
      { feature: '使用方式', slice: '網頁直接用，可加入主畫面（PWA）', sliceGood: true, competitor: '原生 App（iOS／Android）＋網頁版', competitorGood: true },
      { feature: '介面語言', slice: '繁體中文、英文', sliceGood: true, competitor: '多國語言', competitorGood: true }
    ],
    whenSliceTitle: '什麼時候選 SLICE？',
    whenSlice: [
      '短期出遊、聚餐、臨時成團的分帳，SLICE 幾乎沒有起步成本：開群組、把連結丟進 LINE 群，朋友點開就能記帳——不用逼每個人下載 App、註冊帳號。',
      '出國旅遊會用到多種幣別時，SLICE 的多幣別與自訂匯率是免費功能；記帳次數也沒有上限，旅途中密集記帳不會卡住。',
      '結束後，內建的最少轉帳結算會直接告訴每個人「誰轉給誰、轉多少」，一次清空。'
    ],
    whenCompetitorTitle: '什麼時候 Splitwise 可能更適合？',
    whenCompetitor: [
      '如果你需要長期（跨年度）的帳務追蹤、收據掃描、或與室友之間的固定循環帳單，Splitwise 的 Pro 方案有更完整的進階功能，原生 App 的離線體驗也更成熟。',
      '兩者並不衝突：不少人固定帳目用 Splitwise、臨時出遊用 SLICE。'
    ],
    faqTitle: '常見問題',
    faqs: [
      { q: 'SLICE 真的完全免費嗎？', a: '是。SLICE 沒有付費方案、沒有廣告、沒有記帳次數限制，由獨立開發者維護，僅接受自願性質的贊助。' },
      { q: '可以把 Splitwise 的資料匯入 SLICE 嗎？', a: '目前沒有自動匯入功能。建議把 Splitwise 上未結清的帳先結掉，新的行程直接在 SLICE 開新群組記帳。' },
      { q: '不註冊的話，我的資料會不見嗎？', a: '不會。訪客模式會建立匿名帳號，資料儲存在雲端（Google Firebase）；想跨裝置保留紀錄時，隨時可以升級連結 Google 帳號，資料會完整保留。' },
      { q: 'Splitwise 免費版有哪些限制？', a: `以${DATA_AS_OF_ZH}的公開資訊，Splitwise 免費版會顯示廣告、每天可新增的支出筆數有上限，且多幣別換匯、收據掃描等進階功能需訂閱 Pro；實際限制請以官方為準。SLICE 則完全免費、無廣告、記帳次數無上限。` },
      { q: '分帳紀錄可以匯出或備份嗎？', a: 'SLICE 目前沒有 CSV／PDF 匯出功能，但你的帳目會即時儲存在雲端帳號中；連結 Google 帳號後即可跨裝置同步，換手機也不怕遺失紀錄。' }
    ],
    cta: '免費開始分帳',
    disclaimer:
      `Splitwise 相關描述以 ${DATA_AS_OF_ZH}的公開資訊為準，其功能與定價可能變動，請以官方網站為準。Splitwise 為其權利人之商標；本站為獨立專案，與 Splitwise 無任何關聯。`
  },
  en: {
    competitorName: 'Splitwise',
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
      { feature: 'Pricing', slice: 'Completely free, no paid tier', sliceGood: true, competitor: 'Free tier + Pro subscription', competitorGood: false },
      { feature: 'Ads', slice: 'No ads', sliceGood: true, competitor: 'Ads on the free tier', competitorGood: false },
      { feature: 'Sign-up', slice: 'None — guest mode starts instantly', sliceGood: true, competitor: 'Account required', competitorGood: false },
      { feature: 'Expense entries', slice: 'Unlimited', sliceGood: true, competitor: 'Daily limit on the free tier', competitorGood: false },
      { feature: 'Multi-currency', slice: 'Free, with per-group custom rates', sliceGood: true, competitor: 'Currency conversion is a Pro feature', competitorGood: false },
      { feature: 'Minimal-transfer settlement', slice: 'Built in, automatic', sliceGood: true, competitor: 'Supported (simplify debts)', competitorGood: true },
      { feature: 'Receipt scanning', slice: 'Manual entry', sliceGood: false, competitor: 'Scanning/OCR on Pro', competitorGood: true },
      { feature: 'Offline use', slice: 'Online-first (basic PWA caching)', sliceGood: false, competitor: 'More mature offline in native apps', competitorGood: true },
      { feature: 'How friends join', slice: 'Tap an invite link — no account needed', sliceGood: true, competitor: 'Members need to register', competitorGood: false },
      { feature: 'Platform', slice: 'Web, installable to home screen (PWA)', sliceGood: true, competitor: 'Native apps (iOS/Android) + web', competitorGood: true },
      { feature: 'Languages', slice: 'Traditional Chinese, English', sliceGood: true, competitor: 'Many languages', competitorGood: true }
    ],
    whenSliceTitle: 'When to pick SLICE',
    whenSlice: [
      'For trips, dinners, and ad-hoc groups, SLICE has almost zero startup cost: create a group, drop the invite link into your chat, and friends start logging right away — no one has to install an app or create an account.',
      'Traveling across currencies? Multi-currency with custom exchange rates is free in SLICE, and there is no cap on how many expenses you log.',
      'When the trip ends, the built-in minimal-transfer settlement tells everyone exactly who pays whom, and how much, to clear all balances at once.'
    ],
    whenCompetitorTitle: 'When Splitwise may fit better',
    whenCompetitor: [
      'If you need long-running, multi-year ledgers, receipt scanning, or recurring bills with roommates, Splitwise Pro offers more advanced features, and its native apps have a more mature offline experience.',
      'The two are not mutually exclusive — plenty of people keep Splitwise for recurring household bills and use SLICE for one-off trips.'
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Is SLICE really completely free?', a: 'Yes. SLICE has no paid tier, no ads, and no limits on expense entries. It is maintained by an independent developer and funded only by voluntary sponsorship.' },
      { q: 'Can I import my Splitwise data into SLICE?', a: 'There is no automatic import at the moment. We recommend settling outstanding balances in Splitwise first, then starting fresh groups in SLICE for new trips.' },
      { q: "If I don't register, will I lose my data?", a: 'No. Guest mode creates an anonymous account and your data is stored in the cloud (Google Firebase). You can link a Google account at any time to keep your records across devices — nothing is lost when you upgrade.' },
      { q: 'What are the limits on the Splitwise free tier?', a: `As of ${DATA_AS_OF_EN}, the Splitwise free tier shows ads and caps how many expenses you can add per day, and advanced features like currency conversion and receipt scanning require a Pro subscription — check their site for the current limits. SLICE, by contrast, is completely free with no ads and no cap on expense entries.` },
      { q: 'Can I export or back up my expense history?', a: 'SLICE does not offer CSV/PDF export yet, but your data is saved to your cloud account in real time. Link a Google account to sync across devices so you never lose records when switching phones.' }
    ],
    cta: 'Start splitting for free',
    disclaimer:
      `Statements about Splitwise reflect publicly available information as of ${DATA_AS_OF_EN}; its features and pricing may change — check their official site. Splitwise is a trademark of its owner; this site is an independent project not affiliated with Splitwise.`
  }
};

const tricount: CompetitorEntry = {
  slug: 'tricount',
  competitorName: 'Tricount',
  zh: {
    competitorName: 'Tricount',
    title: 'SLICE vs Tricount',
    subtitle: '分帳工具比較',
    description:
      '在 SLICE 與 Tricount 之間猶豫？兩者都免費、都適合旅遊分帳。比較介面語言、加入門檻、網頁 vs App、多幣別與結算方式，挑出更適合你的那一個。',
    intro: [
      'Tricount 是歐洲很受歡迎的旅遊分帳 App，已被銀行 bunq 收購，本身免費、支援多幣別，靠連結分享讓大家一起記帳。',
      '和多數比較不同，SLICE 與 Tricount 在「免費」與「低門檻」這兩點上其實很接近。所以這頁的重點不是價格，而是使用方式、語言與體驗上的差異——尤其對台灣與中文使用者而言。'
    ],
    tableCaption: 'SLICE 與 Tricount 功能比較表',
    rows: [
      { feature: '價格', slice: '完全免費', sliceGood: true, competitor: '免費（由 bunq 提供）', competitorGood: true },
      { feature: '廣告', slice: '無廣告', sliceGood: true, competitor: '大致無干擾廣告', competitorGood: true },
      { feature: '繁體中文介面', slice: '原生繁體中文', sliceGood: true, competitor: '以歐語為主，中文支援有限', competitorGood: false },
      { feature: '註冊門檻', slice: '免註冊，訪客模式秒開', sliceGood: true, competitor: '可用連結加入，主要透過 App', competitorGood: true },
      { feature: '使用方式', slice: '純網頁，可加入主畫面（PWA）', sliceGood: true, competitor: '以原生 App 為主，另有網頁版', competitorGood: true },
      { feature: '多幣別', slice: '免費支援，群組自訂匯率', sliceGood: true, competitor: '免費支援多幣別', competitorGood: true },
      { feature: '最少轉帳結算', slice: '內建自動計算', sliceGood: true, competitor: '提供結算餘額', competitorGood: true },
      { feature: '跨裝置同步', slice: '連結 Google 帳號即同步', sliceGood: true, competitor: '需帳號／App 同步', competitorGood: true },
      { feature: '離線使用', slice: '需連線（PWA 有基本快取）', sliceGood: false, competitor: '原生 App 離線體驗較成熟', competitorGood: true },
      { feature: '銀行整合', slice: '無（純分帳工具）', sliceGood: false, competitor: '可與 bunq 銀行帳戶整合', competitorGood: true }
    ],
    whenSliceTitle: '什麼時候選 SLICE？',
    whenSlice: [
      '如果你的朋友主要用繁體中文、習慣在 LINE 群裡分享連結，SLICE 的在地化與「點連結就開始、不用裝 App」會讓揪團記帳的阻力更低。',
      '想在瀏覽器裡直接用、不想再多裝一個 App，或想把分帳頁「加入主畫面」當成輕量工具，SLICE 的網頁優先設計會更順手。',
      '在意畫面清爽、結算一目了然，SLICE 內建的最少轉帳結算會直接算出誰轉給誰。'
    ],
    whenCompetitorTitle: '什麼時候 Tricount 可能更適合？',
    whenCompetitor: [
      '如果你或同行的人已經在用 Tricount、身處歐洲、或想要更成熟的原生 App 離線體驗，Tricount 是很穩的選擇。',
      '若你剛好是 bunq 的使用者，想把分帳與銀行帳戶整合，那 Tricount 的生態會更順。'
    ],
    faqTitle: '常見問題',
    faqs: [
      { q: 'SLICE 和 Tricount 都免費，差在哪？', a: '主要差在使用方式與語言。SLICE 是網頁優先、免安裝、原生繁體中文、訪客模式秒開；Tricount 以原生 App 為主、在歐洲較普及、可與 bunq 銀行整合。功能定位相近，選擇取決於你和同伴的習慣。' },
      { q: 'Tricount 需要下載 App 嗎？', a: `以${DATA_AS_OF_ZH}的公開資訊，Tricount 主要透過原生 App 使用，也有網頁版；被邀請的人通常會用 App 加入。SLICE 則是純網頁，點連結即可參與，不必安裝。` },
      { q: 'Tricount 有繁體中文嗎？', a: 'Tricount 以歐洲語言為主，繁體中文支援相對有限；SLICE 提供原生繁體中文介面，對台灣使用者更友善。實際語言支援請以官方為準。' },
      { q: '可以把 Tricount 的帳搬到 SLICE 嗎？', a: '目前沒有自動匯入功能。建議在原工具把未結清的帳結掉，新行程直接在 SLICE 開新群組。' },
      { q: 'SLICE 支援多幣別嗎？', a: '支援，且是免費功能。你可以為群組設定自訂匯率，出國旅遊用多種貨幣記帳都沒問題。' }
    ],
    cta: '免費開始分帳',
    disclaimer:
      `Tricount 相關描述以 ${DATA_AS_OF_ZH}的公開資訊為準，其功能與定價可能變動，請以官方網站為準。Tricount 為 bunq 之品牌；本站為獨立專案，與其無任何關聯。`
  },
  en: {
    competitorName: 'Tricount',
    title: 'SLICE vs Tricount',
    subtitle: 'Bill-splitting comparison',
    description:
      'Choosing between SLICE and Tricount? Both are free and travel-friendly. Compare sign-up friction, web vs app, multi-currency, settlement, and localization to pick the better fit.',
    intro: [
      'Tricount is a popular European travel expense-splitting app, now owned by the bank bunq. It is free, supports multiple currencies, and lets a group log expenses together via a shared link.',
      'Unlike most comparisons, SLICE and Tricount are actually close on the "free" and "low-friction" axes. So this page is less about price and more about how you use each one — platform, language, and experience.'
    ],
    tableCaption: 'Feature comparison between SLICE and Tricount',
    rows: [
      { feature: 'Pricing', slice: 'Completely free', sliceGood: true, competitor: 'Free (provided by bunq)', competitorGood: true },
      { feature: 'Ads', slice: 'No ads', sliceGood: true, competitor: 'Largely non-intrusive', competitorGood: true },
      { feature: 'Traditional Chinese UI', slice: 'Native Traditional Chinese', sliceGood: true, competitor: 'European-first; limited Chinese', competitorGood: false },
      { feature: 'Sign-up', slice: 'None — guest mode starts instantly', sliceGood: true, competitor: 'Join by link, mostly via the app', competitorGood: true },
      { feature: 'Platform', slice: 'Web-only, installable (PWA)', sliceGood: true, competitor: 'App-first, with a web version', competitorGood: true },
      { feature: 'Multi-currency', slice: 'Free, with per-group custom rates', sliceGood: true, competitor: 'Multi-currency supported, free', competitorGood: true },
      { feature: 'Minimal-transfer settlement', slice: 'Built in, automatic', sliceGood: true, competitor: 'Provides settlement balances', competitorGood: true },
      { feature: 'Cross-device sync', slice: 'Link a Google account to sync', sliceGood: true, competitor: 'Syncs via account/app', competitorGood: true },
      { feature: 'Offline use', slice: 'Online-first (basic PWA caching)', sliceGood: false, competitor: 'More mature offline in native apps', competitorGood: true },
      { feature: 'Bank integration', slice: 'None (pure splitter)', sliceGood: false, competitor: 'Integrates with bunq accounts', competitorGood: true }
    ],
    whenSliceTitle: 'When to pick SLICE',
    whenSlice: [
      'If your friends mostly speak Traditional Chinese and share links in group chats, SLICE\'s localization and "tap the link, no install" flow lowers the friction of getting everyone logging.',
      'If you would rather use it straight in the browser without installing another app — or pin a lightweight splitter to your home screen — SLICE\'s web-first design fits better.',
      'If you want a clean view and an at-a-glance payoff, SLICE\'s built-in minimal-transfer settlement spells out exactly who pays whom.'
    ],
    whenCompetitorTitle: 'When Tricount may fit better',
    whenCompetitor: [
      'If you or your travel companions already use Tricount, are based in Europe, or want a more mature native-app offline experience, Tricount is a solid pick.',
      'If you happen to be a bunq user and want your splitting tied into a bank account, Tricount\'s ecosystem is a smoother fit.'
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'SLICE and Tricount are both free — what is the difference?', a: 'Mostly platform and language. SLICE is web-first, install-free, natively in Traditional Chinese, with instant guest mode; Tricount is app-first, more widespread in Europe, and integrates with bunq banking. They overlap in purpose, so the choice comes down to your group\'s habits.' },
      { q: 'Do I need to download an app for Tricount?', a: `As of ${DATA_AS_OF_EN}, Tricount is used mainly through its native apps, with a web version available; invited members typically join via the app. SLICE is web-only — tap the link and join, no install required.` },
      { q: 'Does Tricount support Traditional Chinese?', a: 'Tricount is European-language-first, and Traditional Chinese support is relatively limited; SLICE ships a native Traditional Chinese interface. Check the official site for current language coverage.' },
      { q: 'Can I move my Tricount expenses to SLICE?', a: 'There is no automatic import today. We recommend settling outstanding balances in your current tool, then starting a fresh group in SLICE for the next trip.' },
      { q: 'Does SLICE support multiple currencies?', a: 'Yes, and it is free. You can set custom exchange rates per group, so logging across several currencies on an overseas trip works out of the box.' }
    ],
    cta: 'Start splitting for free',
    disclaimer:
      `Statements about Tricount reflect publicly available information as of ${DATA_AS_OF_EN}; its features and pricing may change — check their official site. Tricount is a bunq brand; this site is an independent project not affiliated with it.`
  }
};

const settleUp: CompetitorEntry = {
  slug: 'settle-up',
  competitorName: 'Settle Up',
  zh: {
    competitorName: 'Settle Up',
    title: 'SLICE vs Settle Up',
    subtitle: '分帳工具比較',
    description:
      '比較 SLICE 與 Settle Up：免費版廣告、進階功能訂閱、加入門檻、多幣別與網頁使用。想要完全免費、無廣告的群組分帳？看看兩者差在哪。',
    intro: [
      'Settle Up 是一款跨平台的分帳 App，有免費版與付費（進階）方案；免費版通常會顯示廣告，去廣告與部分進階功能需訂閱。',
      'SLICE 走的是「完全免費、無廣告、無記帳上限」路線，而且免安裝、免註冊。這頁比較兩者在費用模式與使用門檻上的差異。'
    ],
    tableCaption: 'SLICE 與 Settle Up 功能比較表',
    rows: [
      { feature: '價格', slice: '完全免費', sliceGood: true, competitor: '免費版＋進階訂閱', competitorGood: false },
      { feature: '廣告', slice: '無廣告', sliceGood: true, competitor: '免費版有廣告', competitorGood: false },
      { feature: '註冊門檻', slice: '免註冊，訪客模式秒開', sliceGood: true, competitor: '需帳號／App 才能加入', competitorGood: false },
      { feature: '記帳次數', slice: '無限制', sliceGood: true, competitor: '免費版功能受限', competitorGood: false },
      { feature: '使用方式', slice: '純網頁，可加入主畫面（PWA）', sliceGood: true, competitor: '原生 App＋網頁版', competitorGood: true },
      { feature: '多幣別', slice: '免費支援，群組自訂匯率', sliceGood: true, competitor: '支援多幣別', competitorGood: true },
      { feature: '最少轉帳結算', slice: '內建自動計算', sliceGood: true, competitor: '提供結算', competitorGood: true },
      { feature: '收據照片', slice: '手動輸入為主', sliceGood: false, competitor: '進階方案支援', competitorGood: true },
      { feature: '離線使用', slice: '需連線（PWA 有基本快取）', sliceGood: false, competitor: '原生 App 離線體驗較成熟', competitorGood: true },
      { feature: '繁體中文介面', slice: '原生繁體中文', sliceGood: true, competitor: '中文支援有限', competitorGood: false }
    ],
    whenSliceTitle: '什麼時候選 SLICE？',
    whenSlice: [
      '不想看廣告、也不想為了去廣告或解鎖功能付訂閱費，SLICE 完全免費、無廣告，核心功能一次到位。',
      '臨時揪團、聚餐、短程旅遊，SLICE 免安裝、免註冊，把連結丟進群組朋友就能參與，起步成本最低。',
      '需要繁體中文介面與清楚的結算結果時，SLICE 在地化程度更高。'
    ],
    whenCompetitorTitle: '什麼時候 Settle Up 可能更適合？',
    whenCompetitor: [
      '如果你需要收據照片、更多進階設定，或偏好成熟的原生 App 離線體驗，Settle Up 的進階方案值得考慮。',
      '若你的同伴已經在用 Settle Up，沿用既有習慣也很合理。'
    ],
    faqTitle: '常見問題',
    faqs: [
      { q: 'SLICE 和 Settle Up 最大的差別是什麼？', a: 'SLICE 完全免費、無廣告、免安裝、免註冊，原生繁體中文；Settle Up 免費版通常有廣告，去廣告與部分進階功能需訂閱。若你要的是零成本、零門檻的群組分帳，SLICE 更直接。' },
      { q: 'Settle Up 免費版有廣告嗎？', a: `以${DATA_AS_OF_ZH}的公開資訊，Settle Up 免費版通常會顯示廣告，付費（進階）方案可去除廣告並解鎖部分功能；實際內容請以官方為準。SLICE 則全程無廣告。` },
      { q: '不註冊的話資料會不見嗎？', a: '不會。SLICE 訪客模式會建立匿名帳號，資料存在雲端；連結 Google 帳號後即可跨裝置同步保留。' },
      { q: 'SLICE 可以在電腦瀏覽器用嗎？', a: '可以。SLICE 是網頁優先設計，手機、平板、電腦瀏覽器都能直接用，也可以「加入主畫面」當成 App 使用。' },
      { q: 'SLICE 支援多幣別嗎？', a: '支援，且免費。可為群組設定自訂匯率，適合出國旅遊多幣別記帳。' }
    ],
    cta: '免費開始分帳',
    disclaimer:
      `Settle Up 相關描述以 ${DATA_AS_OF_ZH}的公開資訊為準，其功能與定價可能變動，請以官方網站為準。Settle Up 為其權利人之商標；本站為獨立專案，與其無任何關聯。`
  },
  en: {
    competitorName: 'Settle Up',
    title: 'SLICE vs Settle Up',
    subtitle: 'Bill-splitting comparison',
    description:
      'Compare SLICE and Settle Up on free-tier ads, premium features, sign-up friction, multi-currency, and web use. Want a completely free, ad-free group splitter? See how they differ.',
    intro: [
      'Settle Up is a cross-platform expense-splitting app with a free tier and a paid (premium) plan; the free tier typically shows ads, and removing ads plus some advanced features requires a subscription.',
      'SLICE takes the "completely free, no ads, no entry limits" route — and it is install-free and account-free. This page compares the two on cost model and friction.'
    ],
    tableCaption: 'Feature comparison between SLICE and Settle Up',
    rows: [
      { feature: 'Pricing', slice: 'Completely free', sliceGood: true, competitor: 'Free tier + premium subscription', competitorGood: false },
      { feature: 'Ads', slice: 'No ads', sliceGood: true, competitor: 'Ads on the free tier', competitorGood: false },
      { feature: 'Sign-up', slice: 'None — guest mode starts instantly', sliceGood: true, competitor: 'Account/app needed to join', competitorGood: false },
      { feature: 'Expense entries', slice: 'Unlimited', sliceGood: true, competitor: 'Free tier is feature-limited', competitorGood: false },
      { feature: 'Platform', slice: 'Web-only, installable (PWA)', sliceGood: true, competitor: 'Native apps + web', competitorGood: true },
      { feature: 'Multi-currency', slice: 'Free, with per-group custom rates', sliceGood: true, competitor: 'Multi-currency supported', competitorGood: true },
      { feature: 'Minimal-transfer settlement', slice: 'Built in, automatic', sliceGood: true, competitor: 'Provides settlement', competitorGood: true },
      { feature: 'Receipt photos', slice: 'Manual entry', sliceGood: false, competitor: 'Supported on premium', competitorGood: true },
      { feature: 'Offline use', slice: 'Online-first (basic PWA caching)', sliceGood: false, competitor: 'More mature offline in native apps', competitorGood: true },
      { feature: 'Traditional Chinese UI', slice: 'Native Traditional Chinese', sliceGood: true, competitor: 'Limited Chinese support', competitorGood: false }
    ],
    whenSliceTitle: 'When to pick SLICE',
    whenSlice: [
      'If you would rather not see ads or pay a subscription just to remove them or unlock features, SLICE is completely free and ad-free, with the core features available from the start.',
      'For ad-hoc groups, dinners, and short trips, SLICE is install-free and account-free — drop the link into a chat and friends can join, for the lowest possible startup cost.',
      'When you want a Traditional Chinese interface and a clear settlement result, SLICE is more localized.'
    ],
    whenCompetitorTitle: 'When Settle Up may fit better',
    whenCompetitor: [
      'If you need receipt photos, more advanced settings, or prefer a mature native-app offline experience, Settle Up\'s premium plan is worth a look.',
      'If your companions already use Settle Up, sticking with an existing habit is reasonable too.'
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is the biggest difference between SLICE and Settle Up?', a: 'SLICE is completely free, ad-free, install-free and account-free, natively in Traditional Chinese; Settle Up\'s free tier typically has ads, and removing ads plus some advanced features requires a subscription. If you want zero-cost, zero-friction group splitting, SLICE is more direct.' },
      { q: 'Does the Settle Up free tier have ads?', a: `As of ${DATA_AS_OF_EN}, the Settle Up free tier typically shows ads, while the paid (premium) plan removes ads and unlocks some features — check their site for specifics. SLICE has no ads at any point.` },
      { q: "If I don't register, will I lose my data?", a: 'No. SLICE\'s guest mode creates an anonymous account and stores data in the cloud; link a Google account to keep it synced across devices.' },
      { q: 'Can I use SLICE in a desktop browser?', a: 'Yes. SLICE is web-first, so it works directly in phone, tablet, and desktop browsers, and you can "add to home screen" to use it like an app.' },
      { q: 'Does SLICE support multiple currencies?', a: 'Yes, for free. Set custom exchange rates per group — handy for multi-currency logging on overseas trips.' }
    ],
    cta: 'Start splitting for free',
    disclaimer:
      `Statements about Settle Up reflect publicly available information as of ${DATA_AS_OF_EN}; its features and pricing may change — check their official site. Settle Up is a trademark of its owner; this site is an independent project not affiliated with it.`
  }
};

/** Registry of all comparison pages, keyed by URL slug. */
export const COMPARE_COMPETITORS: Record<string, CompetitorEntry> = {
  [splitwise.slug]: splitwise,
  [tricount.slug]: tricount,
  [settleUp.slug]: settleUp
};

/** All comparison slugs, e.g. ['splitwise', 'tricount', 'settle-up']. */
export const COMPARE_SLUGS: string[] = Object.keys(COMPARE_COMPETITORS);

export function getCompetitor(slug: string | undefined): CompetitorEntry | undefined {
  return slug ? COMPARE_COMPETITORS[slug] : undefined;
}
