import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Minus } from 'lucide-react';
import { APP_NAME } from '../constants';
import { COMPARE_COMPETITORS, COMPARE_SLUGS, SITE_ORIGIN, getCompetitor } from '../data/compareData';

interface ComparePageProps {
  /** URL slug, e.g. "splitwise". Parsed by App from /compare/:slug. */
  slug: string;
}

export function ComparePage({ slug }: ComparePageProps) {
  const { i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith('zh') ?? false;
  const lang = isZh ? 'zh-Hant-TW' : 'en';

  const entry = getCompetitor(slug);
  // Defensive: App only renders known slugs, but guard direct/stale renders.
  if (!entry) return <Navigate to="/" replace />;

  const content = isZh ? entry.zh : entry.en;
  const pagePath = `/compare/${entry.slug}`;
  const pageUrl = `${SITE_ORIGIN}${pagePath}`;

  // Hub-and-spoke internal links: every comparison points at its siblings so no
  // page is orphaned and link equity flows across the cluster.
  const siblings = COMPARE_SLUGS.filter((s) => s !== entry.slug).map((s) => COMPARE_COMPETITORS[s]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: APP_NAME, item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: content.title, item: pageUrl }
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
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`${content.title} — ${APP_NAME}`} />
        <meta property="og:description" content={content.description} />
        <meta property="og:url" content={pageUrl} />
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
                      {content.competitorName}
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
                        {row.competitorGood
                          ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-success-green stroke-[3]" />
                          : <Minus className="w-4 h-4 mt-0.5 shrink-0 text-main-text/30 stroke-[3]" />}
                        {row.competitor}
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
            <h2 className="text-xl font-nunito font-black text-main-text mb-3">{content.whenCompetitorTitle}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-main-text/85 font-medium">
              {content.whenCompetitor.map((p, i) => (
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

        {/* Related comparisons — hub-and-spoke internal linking */}
        {siblings.length > 0 && (
          <nav aria-label={isZh ? '其他分帳工具比較' : 'Other comparisons'} className="mt-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-main-text/50 font-nunito mb-4 px-1">
              {isZh ? '其他比較' : 'Other comparisons'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {siblings.map((sib) => (
                <Link
                  key={sib.slug}
                  to={`/compare/${sib.slug}`}
                  className="flex items-center justify-between gap-2 bg-white border-2 border-main-text rounded-2xl px-4 py-3 shadow-[3px_3px_0px_#1A1A2E] hover:bg-brand-light active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all no-underline"
                >
                  <span className="text-[15px] font-nunito font-black text-main-text">
                    SLICE vs {sib.competitorName}
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
