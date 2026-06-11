import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { WebviewBrand, OsPlatform } from '../utils/webview';
import { APP_NAME } from '../constants';

interface WebviewWarningProps {
  brand: WebviewBrand;
  os: OsPlatform;
}

export function WebviewWarning({ brand, os }: WebviewWarningProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const url = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the input text
      const el = document.getElementById('webview-url-input') as HTMLInputElement | null;
      el?.select();
    }
  };

  const brandKey =
    brand === 'line' ? 'line'
    : brand === 'facebook' ? 'facebook'
    : brand === 'instagram' ? 'instagram'
    : brand === 'wechat' ? 'wechat'
    : 'other';

  const steps: string[] = t(`webview.steps.${brandKey}_${os}`, { returnObjects: true, defaultValue: null }) as string[] ||
    t(`webview.steps.other_${os}`, { returnObjects: true, defaultValue: null }) as string[] ||
    t('webview.steps.other_other', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center px-5 py-10 font-plus-jakarta">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-accent-orange text-white font-nunito font-black text-xl px-3 py-1 rounded-lg border-2 border-main-text shadow-[3px_3px_0px_#1A1A2E]">
            {APP_NAME}
          </div>
        </div>

        {/* Warning card */}
        <div className="bg-white border-2 border-main-text rounded-2xl shadow-[4px_4px_0px_#1A1A2E] p-6 mb-5">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="font-nunito font-black text-xl text-main-text mb-2">
            {t('webview.title')}
          </h1>
          <p className="text-sm text-main-text/70 leading-relaxed">
            {t('webview.description')}
          </p>
        </div>

        {/* Step instructions */}
        <div className="bg-brand-light border-2 border-main-text rounded-2xl shadow-[4px_4px_0px_#1A1A2E] p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 text-accent-orange stroke-[2.5]" />
            <span className="font-bold text-sm text-main-text">{t('webview.how_to_open')}</span>
          </div>
          <ol className="space-y-2">
            {Array.isArray(steps) && steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-main-text">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-orange text-white font-bold text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Copy URL section */}
        <div className="bg-white border-2 border-main-text rounded-2xl shadow-[4px_4px_0px_#1A1A2E] p-4">
          <p className="text-xs font-bold text-main-text/60 uppercase tracking-wide mb-2">
            {t('webview.or_copy_url')}
          </p>
          <div className="flex gap-2">
            <input
              id="webview-url-input"
              type="text"
              readOnly
              value={url}
              className="flex-1 min-w-0 text-base bg-page-bg border-2 border-main-text rounded-xl px-3 py-2 text-main-text/70 font-mono text-xs truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-main-text font-bold text-sm transition-all btn-bounce active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]"
              style={{
                background: copied ? '#EAFAF3' : '#FF6B35',
                color: copied ? '#0A7A4A' : '#fff',
                boxShadow: copied ? '3px 3px 0px #1A1A2E' : '3px 3px 0px #1A1A2E',
              }}
            >
              {copied
                ? <Check className="w-4 h-4 stroke-[2.5]" />
                : <Copy className="w-4 h-4 stroke-[2.5]" />}
              {copied ? t('webview.copied') : t('common.copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
