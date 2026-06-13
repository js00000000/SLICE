import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { APP_NAME } from '../constants';

type LegalKind = 'privacy' | 'terms';

interface LegalPageProps {
  kind: LegalKind;
}

const LAST_UPDATED = '2026-06-13';

interface Section {
  h: string;
  body: string[];
}

interface LegalContent {
  title: string;
  subtitle: string;
  description: string;
  sections: Section[];
}

export function LegalPage({ kind }: LegalPageProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith('zh') ?? false;
  const lang = isZh ? 'zh-Hant-TW' : 'en';

  const content: LegalContent = kind === 'privacy' ? getPrivacy(isZh) : getTerms(isZh);
  const path = kind === 'privacy' ? '/privacy' : '/terms';
  const url = `https://slice.fusion-labs.cc${path}`;

  return (
    <div className="min-h-screen bg-page-bg text-main-text font-plus-jakarta">
      <Helmet>
        <html lang={lang} />
        <title>{content.title} — {APP_NAME}</title>
        <meta name="description" content={content.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${content.title} — ${APP_NAME}`} />
        <meta property="og:description" content={content.description} />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content={isZh ? 'zh_TW' : 'en_US'} />
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
        <div className="bg-white border-3 border-main-text rounded-[24px] shadow-[6px_6px_0px_#1A1A2E] p-8 md:p-12">
          <p className="text-xs font-black uppercase tracking-widest text-accent-orange font-nunito mb-3">
            {content.subtitle}
          </p>
          <h1 className="text-4xl md:text-5xl font-nunito font-black text-main-text leading-tight tracking-tight mb-3">
            {content.title}
          </h1>
          <p className="text-sm font-semibold text-gray-500 mb-10">
            {isZh ? '最後更新' : 'Last updated'}: {LAST_UPDATED}
          </p>

          <div className="space-y-8">
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

          <div className="mt-12 pt-6 border-t-2 border-dashed border-main-text/10 text-xs font-semibold text-main-text/60 leading-relaxed">
            {isZh
              ? '本頁面為作者自行擬定的參考版本，不構成法律意見。'
              : 'This page is a working draft provided by the author and does not constitute legal advice.'}
          </div>
        </div>

        <div className="mt-6 text-center text-xs font-black tracking-widest text-main-text/40 font-nunito uppercase">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </main>
    </div>
  );
}

function getPrivacy(isZh: boolean): LegalContent {
  if (isZh) {
    return {
      title: '隱私權政策',
      subtitle: '我們如何處理您的資料',
      description: '了解 SLICE 如何處理您的資料 —— 我們收集什麼、如何使用、您有哪些權利。',
      sections: [
        {
          h: '我們收集的資料',
          body: [
            'SLICE 是一個群組分帳工具。我們僅收集為了讓服務正常運作所必要的資料。',
            '• 帳號資料：以 Google 登入時，您的姓名、電子郵件與頭像（透過 Firebase Authentication 取得）；以訪客身份登入時，僅產生匿名識別碼。',
            '• 群組資料：您建立或加入的群組名稱、成員顯示名稱、與您 Firebase 帳號的綁定。',
            '• 帳目資料：您新增的支出金額、品項描述、付款人與分攤關係。',
            '• 偏好設定：語言選擇、登入狀態（儲存於瀏覽器的 localStorage）。',
            '我們不蒐集您的 IP 位址、不放置追蹤型 Cookie、也不接入第三方分析工具。'
          ]
        },
        {
          h: '我們如何使用資料',
          body: [
            '您的資料僅用於：提供分帳服務、計算群組成員之間的結算金額、讓您可以與群組內其他成員共享紀錄。',
            '我們不會將您的資料出售給任何第三方，也不會用於廣告投放。'
          ]
        },
        {
          h: '資料處理者',
          body: [
            '我們使用以下第三方服務作為資料處理者：',
            '• Google Firebase Authentication（身份驗證）。',
            '• Google Cloud Firestore（資料儲存）。',
            '• Netlify（網站代管）。',
            '這些服務皆受其各自的隱私權政策約束。'
          ]
        },
        {
          h: '您的權利',
          body: [
            '您隨時可以：登出帳號、刪除您建立的群組、退出您加入的群組。',
            '若要刪除帳號或要求清除全部資料，請透過頁尾的「意見回饋」表單與我們聯絡。'
          ]
        },
        {
          h: '政策變更',
          body: [
            '若本政策有重大變更，我們會更新本頁面的「最後更新」日期。建議您定期檢視。'
          ]
        }
      ]
    };
  }
  return {
    title: 'Privacy Policy',
    subtitle: 'How we handle your data',
    description: 'How SLICE handles your data — what we collect, how it is used, and your rights.',
    sections: [
      {
        h: 'What we collect',
        body: [
          'SLICE is a group expense sharing tool. We only collect what the service needs to function.',
          '• Account data: if you sign in with Google, your name, email, and profile photo (via Firebase Authentication); if you continue as a guest, only an anonymous identifier is created.',
          '• Group data: the names of groups you create or join, member display names, and the binding to your Firebase account.',
          '• Expense data: amounts, item descriptions, payers, and split shares you record.',
          '• Preferences: language and login state, stored in your browser via localStorage.',
          'We do not collect your IP address, place tracking cookies, or include third-party analytics.'
        ]
      },
      {
        h: 'How we use it',
        body: [
          'Your data is used only to provide the splitting service, compute settlements between members, and let you share records with other members of your groups.',
          'We do not sell your data to any third party and we do not use it for advertising.'
        ]
      },
      {
        h: 'Data processors',
        body: [
          'We rely on the following services as data processors:',
          '• Google Firebase Authentication (sign-in).',
          '• Google Cloud Firestore (data storage).',
          '• Netlify (hosting).',
          'These services are governed by their own privacy policies.'
        ]
      },
      {
        h: 'Your rights',
        body: [
          'You can sign out at any time, delete groups you created, and leave groups you joined.',
          'To delete your account or request full data removal, contact us via the feedback form linked in the footer.'
        ]
      },
      {
        h: 'Changes to this policy',
        body: [
          'If there is a material change, we will update the "Last updated" date on this page. Please check back periodically.'
        ]
      }
    ]
  };
}

function getTerms(isZh: boolean): LegalContent {
  if (isZh) {
    return {
      title: '服務條款',
      subtitle: '使用 SLICE 的規則',
      description: '使用 SLICE 群組分帳工具的服務條款。',
      sections: [
        {
          h: '同意條款',
          body: [
            '使用 SLICE 即表示您同意遵守本服務條款。若您不同意，請停止使用本服務。'
          ]
        },
        {
          h: '服務性質',
          body: [
            'SLICE 為免費提供的群組分帳工具，「依現狀」提供，不對特定用途之適用性、無中斷性或無錯誤性提供任何明示或默示保證。',
            '我們可能隨時新增、修改或停止服務的部分功能。'
          ]
        },
        {
          h: '您的內容',
          body: [
            '您在 SLICE 中輸入的群組、成員、支出等資料屬於您本人。我們不會主張對其權利，也不會將其用於與服務無關的用途。',
            '您須確保您所輸入的資料不會侵犯他人權益。'
          ]
        },
        {
          h: '禁止行為',
          body: [
            '請勿利用 SLICE 進行任何違法行為、騷擾他人、傳送惡意內容、或干擾服務的正常運作。違反者，我們有權暫停或終止其使用權限。'
          ]
        },
        {
          h: '責任限制',
          body: [
            '在法律許可的最大範圍內，我們不就因使用或無法使用本服務所致之任何間接、附帶、特殊或衍生性損害負責。'
          ]
        },
        {
          h: '條款變更',
          body: [
            '我們可能不時更新本條款。更新時，我們會修改本頁面的「最後更新」日期；繼續使用即表示您接受更新後的條款。'
          ]
        }
      ]
    };
  }
  return {
    title: 'Terms of Service',
    subtitle: 'Rules for using SLICE',
    description: 'Terms of using SLICE, our free group expense sharing tool.',
    sections: [
      {
        h: 'Acceptance',
        body: [
          'By using SLICE you agree to these terms. If you do not agree, please stop using the service.'
        ]
      },
      {
        h: 'The service',
        body: [
          'SLICE is a free group expense sharing tool provided "as is", without warranty of any kind, express or implied, including fitness for a particular purpose or uninterrupted availability.',
          'We may add, modify, or discontinue parts of the service at any time.'
        ]
      },
      {
        h: 'Your content',
        body: [
          'Groups, members, and expenses you record belong to you. We make no claim to your data and will not use it for purposes unrelated to providing the service.',
          'You are responsible for ensuring the data you enter does not infringe on the rights of others.'
        ]
      },
      {
        h: 'Prohibited use',
        body: [
          'Do not use SLICE for any unlawful activity, to harass others, to transmit malicious content, or to interfere with the normal operation of the service. We may suspend or terminate access for violations.'
        ]
      },
      {
        h: 'Limitation of liability',
        body: [
          'To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the service.'
        ]
      },
      {
        h: 'Changes to these terms',
        body: [
          'We may update these terms occasionally. When we do, we will revise the "Last updated" date on this page; continued use means you accept the updated terms.'
        ]
      }
    ]
  };
}
