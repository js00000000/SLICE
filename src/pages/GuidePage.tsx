import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { APP_NAME } from '../constants';
import { GUIDE_GUIDES, GUIDE_SLUGS, SITE_ORIGIN, getGuide } from '../data/guideData';

interface GuidePageProps {
  /** URL slug, e.g. "japan-trip". Parsed by App from /guide/:slug. */
  slug: string;
}

// Programmatic /guide/:scenario pages, rendered from src/data/guideData.ts.
//
// These are intentionally single-language zh-Hant-TW: the SPA resolves language
// from the browser, so Googlebot (en-US) would otherwise render English over the
// Chinese-keyword content these pages target. Pinning <html lang> and the copy to
// Traditional Chinese keeps the crawlable body aligned with search intent.
export function GuidePage({ slug }: GuidePageProps) {
  const entry = getGuide(slug);
  // Defensive: App only renders known slugs, but guard direct/stale renders.
  if (!entry) return <Navigate to="/" replace />;

  const pagePath = `/guide/${entry.slug}`;
  const pageUrl = `${SITE_ORIGIN}${pagePath}`;
  const updated = entry.updated ?? entry.published;
  const ogDescription = entry.ogDescription ?? entry.description;

  // Hub-and-spoke internal links: every guide points at its siblings so no page
  // is orphaned and link equity flows across the cluster.
  const siblings = GUIDE_SLUGS.filter((s) => s !== entry.slug).map((s) => GUIDE_GUIDES[s]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: APP_NAME, item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: entry.title, item: pageUrl }
        ]
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: entry.headline,
        description: entry.description,
        inLanguage: 'zh-TW',
        datePublished: entry.published,
        dateModified: updated,
        mainEntityOfPage: pageUrl,
        author: { '@id': `${SITE_ORIGIN}/#publisher` },
        publisher: { '@id': `${SITE_ORIGIN}/#publisher` }
      },
      {
        '@type': 'FAQPage',
        mainEntity: entry.faqs.map(({ q, a }) => ({
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
        <title>{`${entry.headline} — ${APP_NAME}`}</title>
        <meta name="description" content={entry.description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`${entry.title} — ${APP_NAME}`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={pageUrl} />
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
            {entry.eyebrow}
          </p>
          <h1 className="text-3xl md:text-5xl font-nunito font-black text-main-text leading-tight tracking-tight mb-3">
            {entry.title}
          </h1>
          <p className="text-sm font-semibold text-gray-500 mb-8">
            {entry.tagline} · 更新於 {updated}
          </p>

          <div className="space-y-8 mb-10">
            {entry.sections.map((sec, i) => (
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
              {entry.faqs.map(({ q, a }, i) => (
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

        {/* Related guides — hub-and-spoke internal linking */}
        {siblings.length > 0 && (
          <nav aria-label="其他分帳教學" className="mt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-main-text/50 font-nunito mb-4 px-1">
              其他分帳教學
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {siblings.map((sib) => (
                <Link
                  key={sib.slug}
                  to={`/guide/${sib.slug}`}
                  className="flex items-center justify-between gap-2 bg-white border-2 border-main-text rounded-2xl px-4 py-3 shadow-[3px_3px_0px_#1A1A2E] hover:bg-brand-light active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all no-underline"
                >
                  <span className="text-[15px] font-nunito font-black text-main-text">
                    {sib.title}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 stroke-[3] text-accent-orange" />
                </Link>
              ))}
            </div>
          </nav>
        )}

        <div className="mt-6 text-center text-xs font-black tracking-widest text-main-text/40 font-nunito uppercase">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </main>
    </div>
  );
}
