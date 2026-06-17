import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWebview } from './webview';

describe('isWebview', () => {
  let originalUserAgent: string | undefined;
  let hadNavigator = true;

  beforeEach(() => {
    if (typeof globalThis.navigator === 'undefined') {
      hadNavigator = false;
      (globalThis as any).navigator = { userAgent: '' };
    }
    originalUserAgent = globalThis.navigator?.userAgent;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (hadNavigator && originalUserAgent !== undefined) {
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    } else {
      delete (globalThis as any).navigator;
    }
  });

  const setUserAgent = (ua: string) => {
    if (typeof globalThis.navigator === 'undefined') {
      (globalThis as any).navigator = { userAgent: '' };
    }
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value: ua,
      configurable: true,
    });
  };

  it('should detect LINE in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/13.8.0');
    expect(isWebview()).toBe(true);

    setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.0.0 Mobile Safari/537.36 Line/13.8.0');
    expect(isWebview()).toBe(true);
  });

  it('should detect Facebook / Messenger in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/415.0.0.32.73;FBBV/481191054;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/16.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBCR/]');
    expect(isWebview()).toBe(true);

    setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-G998B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/415.0.0.32.73;]');
    expect(isWebview()).toBe(true);
  });

  it('should detect Instagram in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 287.0.0.22.79');
    expect(isWebview()).toBe(true);
  });

  it('should detect WeChat (MicroMessenger) in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.37(0x1800252c) NetType/WIFI Language/en');
    expect(isWebview()).toBe(true);
  });

  it('should detect TikTok in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_29.3.0');
    expect(isWebview()).toBe(true);
  });

  it('should detect Threads in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Barcelona 338.0.0.32.109 (iPhone15,3; iOS 17_5_1; en_US; en; scale=3.00; 1290x2796; 612345678) IABMV/1');
    expect(isWebview()).toBe(true);
  });

  it('should detect X/Twitter in-app browser', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 Twitter for iPhone/10.65');
    expect(isWebview()).toBe(true);
  });

  it('should detect generic Android WebView', () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-G998B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.0.0 Mobile Safari/537.36');
    expect(isWebview()).toBe(true);
  });

  it('should NOT detect standard Chrome on desktop', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    expect(isWebview()).toBe(false);
  });

  it('should NOT detect standard Safari on iOS', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1');
    expect(isWebview()).toBe(false);
  });
});
