// Data-driven registry for the /guide/:scenario programmatic-SEO pages.
//
// Each entry is one indexable scenario guide (a long-form, keyword-targeted
// "how to split X" article). The generic template lives in src/pages/GuidePage.tsx
// and renders purely from the content here, so adding a scenario = add one entry
// below + one line in scripts/seo-routes.mjs (a Vitest guard in guideData.test.ts
// fails if the two drift).
//
// These pages are intentionally SINGLE-LANGUAGE zh-Hant-TW (unlike the bilingual
// /compare pages). The SPA resolves language from the browser, so Googlebot
// (en-US) would render English over Chinese-keyword content and strip the very
// keywords these pages target. Pinning each page to Traditional Chinese keeps the
// crawlable body aligned with the search intent. See the same reasoning that
// shaped the original hand-written /guide/travel-split page.
//
// Every entry ships genuinely differentiated content — distinct sections and FAQs
// tied to one concrete scenario — to stay clear of thin- and duplicate-content
// penalties and keyword cannibalization between guides.

import { SITE_ORIGIN } from './compareData';

export { SITE_ORIGIN };

export interface GuideSection {
  h: string;
  body: string[];
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideEntry {
  slug: string;
  /** Small orange eyebrow label above the H1, e.g. "旅遊分帳攻略". */
  eyebrow: string;
  /** Page H1. */
  title: string;
  /** Full article headline for <title> + Article schema (may extend the H1). */
  headline: string;
  /** One-line subtitle rendered under the H1. */
  tagline: string;
  /** Meta description (SERP snippet). */
  description: string;
  /** Optional shorter description for og:description; falls back to description. */
  ogDescription?: string;
  /** ISO date, e.g. "2026-07-18". */
  published: string;
  /** ISO date; defaults to published when omitted. */
  updated?: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
}

const travelSplit: GuideEntry = {
  slug: 'travel-split',
  eyebrow: '旅遊分帳攻略',
  title: '出國旅遊分帳全攻略',
  headline: '出國旅遊分帳全攻略：多幣別、墊付、結算一次搞定',
  tagline: '多幣別、墊付、結算一次搞定',
  description:
    '出國旅遊怎麼分帳？多幣別怎麼換算、多人墊付怎麼記、回國怎麼用最少轉帳結清——一篇搞懂旅遊分帳的完整流程，附免費工具推薦。',
  ogDescription:
    '多幣別怎麼換算、多人墊付怎麼記、回國怎麼用最少轉帳結清——一篇搞懂旅遊分帳的完整流程。',
  published: '2026-07-08',
  sections: [
    {
      h: '為什麼出國分帳總是一團亂？',
      body: [
        '出國旅遊的帳有三個難點：多人墊付（機票你刷、住宿他訂、晚餐我付）、多種貨幣（日圓現金、美元刷卡、台幣預付）、事後對帳（回國後對著一堆收據和截圖回憶「這筆誰付的」）。',
        '任何一點單獨都不難，三個疊在一起就是災難。解法不是更用力地記，而是把「記帳」變得夠簡單，讓每一筆在發生的當下就被記下來。'
      ]
    },
    {
      h: '出發前：先開好分帳群組',
      body: [
        '出發前把分帳群組建好、全員加入，是整趟旅程帳目乾淨的關鍵。選工具時看三件事：全員都能記帳（不是只有一個人扛）、支援多幣別、加入門檻夠低。',
        '如果用 SLICE：建立群組後複製邀請連結丟進 LINE 群，成員點開就能加入——不用下載 App、不用註冊。多人共同付款、不均分攤（例如有人不喝酒）都支援。'
      ]
    },
    {
      h: '旅途中：記帳三原則',
      body: [
        '一、當下記：付完錢 30 秒內記完，「回飯店再記」等於不會記。',
        '二、記原幣別：在日本花日圓就記日圓、刷美元就記美元，不要當場心算換台幣——換算是結算時才做的事，當場換只會算錯。',
        '三、記清楚付款人與分攤者：誰墊的錢、哪些人該分，是結算正確的前提。多人合付一筆（例如兩人各出一半訂金）也要如實記錄。'
      ]
    },
    {
      h: '多幣別的帳怎麼算？',
      body: [
        '多幣別是旅遊分帳最容易吵架的環節，因為每個人心中的匯率不一樣。做法是：全團議定一個匯率基準（常見選擇：出發前換匯的實際匯率、或信用卡帳單匯率），寫進群組共識，整趟沿用。',
        '在 SLICE 中，主辦人可以替群組設定各幣別的匯率，記帳時各筆維持原幣別，結算時自動換算成主幣別——這個功能完全免費（多數分帳 App 把換匯功能鎖在付費方案）。'
      ]
    },
    {
      h: '回國後：用最少的轉帳次數結清',
      body: [
        '結算不是「每個人跟每個人互轉」，而是先算出每個人的淨額（總墊付減總應攤），再由欠最多的轉給被欠最多的。數學上 N 個人最多只需要 N−1 次轉帳就能全部結清。',
        'SLICE 內建這個最佳化演算法：按下結算，直接告訴每個人「轉給誰、轉多少」，轉完標記付款，全團歸零。'
      ]
    }
  ],
  faqs: [
    {
      q: '匯率要用哪一個才公平？',
      a: '最常見的做法是全團議定一個固定匯率（例如出發前的換匯匯率，或刷卡帳單匯率的平均值），整趟旅程沿用。重點不是匯率多精準，而是全團用同一個標準。在 SLICE 中由主辦人替群組設定各幣別匯率，所有結算自動換算。'
    },
    {
      q: '有人提早回國或中途加入，帳要怎麼算？',
      a: '記帳時只把實際參與該筆消費的人列入分攤即可。SLICE 的每筆支出都能自訂分攤對象與金額，中途加入或提早離團的人只會分攤到自己參與的部分，結算時自動歸戶。'
    },
    {
      q: '需要每個人都下載 App、註冊帳號嗎？',
      a: '用 SLICE 的話不用。主辦人建立群組後把邀請連結丟進聊天群，成員點開網頁即可記帳——不用下載 App、不用註冊帳號，這對「一次出遊」的臨時群組特別重要。'
    }
  ]
};

const japanTrip: GuideEntry = {
  slug: 'japan-trip',
  eyebrow: '日本旅遊分帳',
  title: '日本自由行分帳怎麼算？',
  headline: '日本自由行分帳攻略：日圓現金、刷卡、IC 卡儲值與代買一次搞定',
  tagline: '現金、刷卡、IC 卡、代買，一次算清楚',
  description:
    '日本自由行怎麼分帳？日圓現金與刷卡怎麼記、Suica／ICOCA 儲值怎麼均攤、藥妝電器代買與免稅怎麼算——專為日本旅遊設計的分帳流程與免費工具。',
  published: '2026-07-18',
  sections: [
    {
      h: '為什麼日本自由行的帳特別難算？',
      body: [
        '日本旅遊有幾個台灣人特別容易踩的分帳雷點：現金與刷卡混用（很多小店只收現金，飯店大店可以刷卡）、日圓面額大又零錢多（一餐動輒好幾千日圓，心算換台幣很容易錯）、代買特別多（幫同行的人買藥妝、電器、伴手禮）。',
        '這些不是「更認真記」就能解決的，而是要有一套固定規則：一律記日圓、代買單獨歸戶、匯率回國再統一換算。以下逐項說明。'
      ]
    },
    {
      h: '現金與刷卡：記帳一律記日圓',
      body: [
        '不管是付現金還是刷卡，記帳金額都記「日圓原價」，不要當場換成台幣。刷卡的實際入帳台幣金額，要等信用卡帳單出來才知道（含國外交易手續費約 1.5%），當下換算只會和帳單對不起來。',
        '在 SLICE 裡把群組主幣別設成日圓（JPY），整趟旅程所有支出都記日圓，帳面乾淨、也不會因為每個人心中匯率不同而吵架。真正要換回台幣，是回國結算時才做的一次性動作。'
      ]
    },
    {
      h: '交通 IC 卡（Suica／ICOCA）儲值怎麼分？',
      body: [
        '如果全團共用一張 IC 卡刷進出站、買飲料，最乾淨的做法是：把每次「儲值」記成一筆由儲值者墊付、全團均攤的共同支出，卡片裡的餘額當成團體公費在用。',
        '如果是各自持卡、各自儲值，那 IC 卡的錢就不進團體帳——那是個人交通費。行程結束時如果共用卡還有餘額沒用完，把餘額當成一筆「退還」沖回儲值者，或在結算時一併調整，避免有人多付。'
      ]
    },
    {
      h: '藥妝、電器代買與免稅怎麼算？',
      body: [
        '幫特定某個人買的東西（例如幫媽媽買的藥妝、幫同事代購的相機），不是團體共同支出，不能均攤給全團。正確做法是記成「A 幫 B 墊付」——付款人是你、分攤者只有那位朋友，金額全歸他。',
        '免稅（Tax Free）要以「實際付款金額」為準記帳，不是標籤上的含稅價。很多店家是結帳當下直接扣稅，那就記扣稅後的實付金額；若是事後退稅櫃台退現金，退回的部分再沖銷給原本墊付的人。'
      ]
    },
    {
      h: '匯率出發前就先設好，結算自動換算',
      body: [
        '很多人以為換算匯率是回國後才處理的事，其實出發前就能先決定。SLICE 讓主辦人在群組裡直接設定日圓對台幣的匯率，之後每筆都記日圓、系統依這個匯率自動換算——全團從第一筆帳就用同一把尺，不必各自心算、各自換。',
        '要用哪個匯率不必糾結：出發前換現鈔的匯率、或預估的刷卡帳單匯率都行，重點是全團一致。若最後想改用更精準的帳單匯率，回國後在群組設定裡改一個數字，所有結算會一起重算，不用逐筆調整。',
        '結算時 SLICE 用最少轉帳次數的演算法算出「誰轉給誰、轉多少」：先算每個人的淨額，再由欠最多的轉給被欠最多的，N 個人最多 N−1 次就全部結清，轉完標記付款即可歸零。'
      ]
    }
  ],
  faqs: [
    {
      q: '日圓要用哪個匯率換回台幣才公平？',
      a: '出發前就先決定一個匯率、整趟沿用即可，例如換現鈔的匯率或預估的刷卡帳單匯率，重點是全團用同一個標準而不是每筆各自換。SLICE 讓主辦人在群組設定裡直接填日圓匯率，每筆自動換算；若回國後想改用更精準的帳單匯率，改一個數字全部重算。'
    },
    {
      q: '一起儲值的 Suica／ICOCA 卡最後沒用完怎麼辦？',
      a: '把共用卡當成團體公費：每次儲值記成一筆均攤的共同支出。行程結束若還有餘額，把剩餘金額當成一筆退款沖回儲值的人，或在最後結算時一併扣除，這樣就不會有人為了沒用到的餘額多付錢。'
    },
    {
      q: '幫朋友代買藥妝的錢要算進團體帳嗎？',
      a: '不要均攤給全團。幫特定某人買的東西，記成「你墊付、只有那位朋友分攤」，金額全歸他一個人。SLICE 每筆支出都能自訂付款人與分攤對象，代買歸戶很直接。'
    },
    {
      q: '在日本刷卡，帳單匯率還沒出來就想先分帳，怎麼記？',
      a: '照樣記日圓原價就好，不用等帳單。分帳算的是「誰對誰的日圓債務」，換不換成台幣、用哪個匯率是最後結算才決定的一步，所以刷卡當下記日圓金額完全不影響分帳正確性。'
    }
  ]
};

const diningAa: GuideEntry = {
  slug: 'dining-aa',
  eyebrow: '聚餐 AA 分帳',
  title: '聚餐 AA 制怎麼分才公平？',
  headline: '聚餐 AA 制分帳攻略：服務費、不均分、代付一次算清楚',
  tagline: '服務費、只喝飲料的人、代付，通通算得清楚',
  description:
    '聚餐吃飯 AA 制怎麼分才公平？服務費與開瓶費怎麼算、有人不喝酒只吃飯怎麼不均分、一個人先付大家再還——聚餐分帳的完整做法與免費工具。',
  published: '2026-07-18',
  sections: [
    {
      h: 'AA 制不是「總額除以人數」這麼簡單',
      body: [
        '最常見的 AA 就是把帳單總額平均分。人人點差不多、一起喝一起吃時，這樣最省事也夠公平。但只要有人多點了一份牛排、有人全程只喝白開水，硬要均分就會有人默默吃虧、有人佔便宜，下次揪團的意願就低了。',
        '公平的 AA 有兩種情況要分開處理：能均分的（大家共享的鍋物、前菜、服務費）就均分；明顯屬於個人的（個人單點、酒水）就單獨算。先分清楚這兩類，再決定怎麼拆。'
      ]
    },
    {
      h: '服務費、開瓶費要不要一起分？',
      body: [
        '一成服務費是按整桌消費收的，屬於全桌共享，通常直接連同餐點一起均攤最單純——你不需要為了服務費另外拆一筆。若餐廳是對特定品項（例如自帶酒的開瓶費）收費，那就把它算進「該喝酒的人」那一組，而不是全桌均攤。',
        '實務上最省事的做法：把含服務費的帳單總額當作要分的金額，共享的部分均攤、個人單點的部分另外歸戶，兩邊加起來就是每個人該付的錢。'
      ]
    },
    {
      h: '有人不喝酒、只吃一點：用不均分',
      body: [
        '這是聚餐分帳最容易起爭議的地方。喝酒的、點貴主餐的，本來就該多分一點。做法是把「大家共享的」跟「個人專屬的」拆成兩筆：共享的均攤全部人，酒水／個人單點只分攤實際享用的人。',
        'SLICE 的每一筆支出都能自訂分攤對象與金額：一鍋大家一起吃的鍋物勾選全部人均分，那瓶只有三個人喝的酒就只勾那三個人。不必用計算機硬算，只要決定「誰有份」就好。'
      ]
    },
    {
      h: '一個人先付、大家再還：記成一筆墊付',
      body: [
        '聚餐通常是一個人先刷卡結帳、其他人事後還錢。這在分帳裡就是一筆「墊付」：付款人是刷卡的那個人，分攤者是所有該分的人。記下這一筆，系統就知道每個人欠付款人多少。',
        '用 SLICE 的話，付款人建一筆支出、選好分攤者，結算時會直接算出「每個人要還給誰多少」，不用你在群組裡一個一個 tag、也不會有人還了、有人忘了還。'
      ]
    },
    {
      h: '湊整數與尾數怎麼處理？',
      body: [
        '均分常會除不盡（例如 3 個人分 1,000 元，一人 333.33 元）。SLICE 的均分是「分到分」的：把除不盡的零頭平均分到前幾個人身上，總和永遠等於帳單金額，不會多一塊少一塊。',
        '如果大家想省事，也可以約定「尾數由某個人吸收」或全部湊整數——重點是當場講好規則，記帳時如實反映，事後就沒有人會為了幾塊錢覺得算不清楚。'
      ]
    }
  ],
  faqs: [
    {
      q: '聚餐 AA 一定要平均分嗎？',
      a: '不一定。大家點得差不多時平均分最省事；但只要有人多點、有人只喝水，平均分就不公平。建議把共享的餐點均攤、個人單點與酒水單獨歸戶，才不會有人吃虧。SLICE 每筆都能自訂分攤對象，兩種情況都好處理。'
    },
    {
      q: '服務費和開瓶費要算進 AA 嗎？',
      a: '一成服務費屬於全桌共享，通常連同餐點一起均攤最單純。開瓶費若是針對自帶酒收的，就只算進喝酒的人那一組，而不是全桌均攤。'
    },
    {
      q: '有人只喝飲料沒喝酒，怎麼分比較公平？',
      a: '把酒水從均攤裡拆出來，只分攤給實際有喝的人；其他大家共享的餐點再全部均分。這樣沒喝酒的人不用替酒錢買單，是最不容易吵架的做法。'
    },
    {
      q: '我先幫大家付了，怎麼記帳最不會忘？',
      a: '當場就把它記成一筆墊付：付款人是你、分攤者是所有該分的人。用 SLICE 建一筆支出選好分攤者，結算時會自動算出每個人要還你多少，不用事後在群組裡一個一個追。'
    }
  ]
};

/** Registry of all guide pages, keyed by URL slug. */
export const GUIDE_GUIDES: Record<string, GuideEntry> = {
  [travelSplit.slug]: travelSplit,
  [japanTrip.slug]: japanTrip,
  [diningAa.slug]: diningAa
};

/** All guide slugs, e.g. ['travel-split', 'japan-trip', 'dining-aa']. */
export const GUIDE_SLUGS: string[] = Object.keys(GUIDE_GUIDES);

export function getGuide(slug: string | undefined): GuideEntry | undefined {
  return slug ? GUIDE_GUIDES[slug] : undefined;
}
