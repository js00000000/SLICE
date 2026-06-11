export function isWebview(): boolean {
  const ua = navigator.userAgent;

  if (/Line\//i.test(ua) || /LIFF\//.test(ua)) return true;
  if (/FBAN|FBAV|FB_IAB|FBIOS|FBANDROID/.test(ua)) return true;
  if (/Instagram/.test(ua)) return true;
  if (/MicroMessenger/.test(ua)) return true;
  if (/musical_ly|TikTok/.test(ua)) return true;

  // Generic Android WebView
  if (/Android/.test(ua) && /\bwv\b/.test(ua)) return true;

  return false;
}
