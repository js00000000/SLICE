import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { APP_NAME } from '../constants';

const PAGE_PATH = '/guide/travel-split';
const PAGE_URL = `https://slice.fusion-labs.cc${PAGE_PATH}`;
const PUBLISHED = '2026-07-08';

// 單語中文內容頁：語言由瀏覽器偵測的 SPA 會讓 Googlebot（en-US）渲染出英文
// 內容，導致中文關鍵字失去主體內容支撐。這一頁刻意不走 i18n，整頁固定
// zh-Hant-TW，中文搜尋看到的就是完整中文內容。
const FAQS = [
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
];

interface Section {
  h: string;
  body: string[];
}

const SECTIONS: Section[] = [
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
];

export function TravelSplitGuidePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: APP_NAME, item: 'https://slice.fusion-labs.cc/' },
          { '@type': 'ListItem', position: 2, name: '出國旅遊分帳全攻略', item: PAGE_URL }
        ]
      },
      {
        '@type': 'Article',
        '@id': `${PAGE_URL}#article`,
        headline: '出國旅遊分帳全攻略：多幣別、墊付、結算一次搞定',
        description:
          '出國旅遊怎麼分帳？多幣別怎麼換算、多人墊付怎麼記、回國怎麼用最少轉帳結清——一篇搞懂旅遊分帳的完整流程。',
        inLanguage: 'zh-TW',
        datePublished: PUBLISHED,
        dateModified: PUBLISHED,
        mainEntityOfPage: PAGE_URL,
        author: { '@id': 'https://slice.fusion-labs.cc/#publisher' },
        publisher: { '@id': 'https://slice.fusion-labs.cc/#publisher' }
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map(({ q, a }) => ({
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
        <html lang="zh-Hant-TW" />
        <title>{`出國旅遊分帳全攻略：多幣別、墊付、結算一次搞定 — ${APP_NAME}`}</title>
        <meta
          name="description"
          content="出國旅遊怎麼分帳？多幣別怎麼換算、多人墊付怎麼記、回國怎麼用最少轉帳結清——一篇搞懂旅遊分帳的完整流程，附免費工具推薦。"
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content={`出國旅遊分帳全攻略 — ${APP_NAME}`} />
        <meta
          property="og:description"
          content="多幣別怎麼換算、多人墊付怎麼記、回國怎麼用最少轉帳結清——一篇搞懂旅遊分帳的完整流程。"
        />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="zh_TW" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <header className="w-full max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-black font-nunito text-main-text bg-white border-2 border-main-text rounded-full px-4 py-2 shadow-[2px_2px_0px_#1A1A2E] hover:bg-brand-light active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          返回首頁
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-accent-orange text-white rounded-lg border-2 border-main-text flex items-center justify-center font-nunito font-black text-sm rotate-[-4deg] shadow-[2px_2px_0px_#1A1A2E]">
            <span className="scale-95 italic">S/</span>
          </div>
          <span className="font-nunito font-black text-xl tracking-tight text-main-text">{APP_NAME}</span>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-6 pt-6 pb-20">
        <article className="bg-white border-3 border-main-text rounded-[24px] shadow-[6px_6px_0px_#1A1A2E] p-6 md:p-12">
          <p className="text-xs font-black uppercase tracking-widest text-accent-orange font-nunito mb-3">
            旅遊分帳攻略
          </p>
          <h1 className="text-3xl md:text-5xl font-nunito font-black text-main-text leading-tight tracking-tight mb-3">
            出國旅遊分帳全攻略
          </h1>
          <p className="text-sm font-semibold text-gray-500 mb-8">
            多幣別、墊付、結算一次搞定 · 更新於 {PUBLISHED}
          </p>

          <div className="space-y-8 mb-10">
            {SECTIONS.map((sec, i) => (
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
            <h2 className="text-xl font-nunito font-black text-main-text mb-4">常見問題</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }, i) => (
                <div key={i} className="bg-page-bg border-2 border-main-text rounded-2xl p-4">
                  <h3 className="text-[15px] font-nunito font-black text-main-text mb-1.5">{q}</h3>
                  <p className="text-sm font-medium text-main-text/80 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="text-[15px] leading-relaxed text-main-text/85 font-medium mb-10">
            想比較各家分帳工具的差異？可以參考{' '}
            <Link to="/compare/splitwise" className="text-accent-orange font-bold hover:underline">
              SLICE 與 Splitwise 的完整比較
            </Link>
            ，或到{' '}
            <Link to="/about" className="text-accent-orange font-bold hover:underline">
              關於 SLICE
            </Link>{' '}
            了解我們為什麼做這個工具。
          </p>

          <div className="text-center">
            <Link
              to="/#get-started"
              className="inline-flex items-center gap-2 bg-accent-orange text-white font-nunito font-black text-lg px-8 py-4 rounded-2xl border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] hover:bg-[#ff7b4b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all no-underline"
            >
              免費開始分帳
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </Link>
          </div>
        </article>

        <div className="mt-6 text-center text-xs font-black tracking-widest text-main-text/40 font-nunito uppercase">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </main>
    </div>
  );
}
