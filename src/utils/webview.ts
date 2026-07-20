export function isWebview(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent;

  if (/Line\//i.test(ua) || /LIFF\//i.test(ua)) return true;
  if (/FBAN|FBAV|FB_IAB|FBIOS|FBANDROID/i.test(ua)) return true;
  if (/Instagram/i.test(ua)) return true;
  if (/MicroMessenger/i.test(ua)) return true;
  if (/musical_ly|TikTok/i.test(ua)) return true;
  if (/Barcelona|Threads/i.test(ua)) return true; // Threads (Barcelona)
  if (/Twitter/i.test(ua)) return true;   // Twitter / X
  if (/Telegram/i.test(ua)) return true;  // Telegram
  if (/WhatsApp/i.test(ua)) return true;  // WhatsApp

  // Generic Android WebView
  if (/Android/.test(ua) && /\bwv\b/.test(ua)) return true;

  // Generic iOS WebView (Mobile/ without Safari/ or with GSA/GoogleApp)
  if (/iPhone|iPod|iPad/.test(ua) && !/Safari\//.test(ua) && /Mobile\//.test(ua)) return true;

  return false;
}
