export type WebviewBrand = 'line' | 'facebook' | 'instagram' | 'wechat' | 'tiktok' | 'other';
export type OsPlatform = 'ios' | 'android' | 'other';

export interface WebviewInfo {
  isWebview: boolean;
  brand: WebviewBrand;
  os: OsPlatform;
}

export function detectWebview(): WebviewInfo {
  const ua = navigator.userAgent;

  const os: OsPlatform = /iPhone|iPad|iPod/.test(ua)
    ? 'ios'
    : /Android/.test(ua)
    ? 'android'
    : 'other';

  if (/Line\//i.test(ua) || /LIFF\//.test(ua)) return { isWebview: true, brand: 'line', os };
  if (/FBAN|FBAV|FB_IAB|FBIOS|FBANDROID/.test(ua)) return { isWebview: true, brand: 'facebook', os };
  if (/Instagram/.test(ua)) return { isWebview: true, brand: 'instagram', os };
  if (/MicroMessenger/.test(ua)) return { isWebview: true, brand: 'wechat', os };
  if (/musical_ly|TikTok/.test(ua)) return { isWebview: true, brand: 'tiktok', os };

  // Generic Android WebView: contains "wv" flag
  if (os === 'android' && /\bwv\b/.test(ua)) return { isWebview: true, brand: 'other', os };

  return { isWebview: false, brand: 'other', os };
}
