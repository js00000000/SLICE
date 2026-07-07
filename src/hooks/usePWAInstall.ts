import { useCallback, useEffect, useState } from 'react';
import { isWebview } from '../utils/webview';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_AT_KEY = 'pwa-install-dismissed-at';
const INSTALLED_KEY = 'pwa-installed';
const SESSION_COUNT_KEY = 'pwa-install-session-count';
const SESSION_COUNTED_KEY = 'pwa-install-session-counted';

// A dismissal hides the prompt for two weeks, not forever — install intent
// grows with usage, so it's worth re-asking occasionally.
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
// Don't pitch the install on someone's very first visit; wait until they've
// come back at least once.
const MIN_SESSIONS = 2;

export type InstallPlatform = 'native' | 'ios';

// `beforeinstallprompt` can fire before React finishes mounting, so the event
// is captured at module scope (this module is imported from main.tsx via
// InstallPrompt, i.e. evaluated before first paint) and handed to the hook.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    try {
      localStorage.setItem(INSTALLED_KEY, 'true');
    } catch { /* storage unavailable */ }
    notify();
  });
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ masquerades as macOS but is the only "Mac" with multi-touch.
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function bumpSessionCount(): number {
  try {
    const count = parseInt(localStorage.getItem(SESSION_COUNT_KEY) ?? '0', 10) || 0;
    if (sessionStorage.getItem(SESSION_COUNTED_KEY)) return count;
    sessionStorage.setItem(SESSION_COUNTED_KEY, 'true');
    localStorage.setItem(SESSION_COUNT_KEY, String(count + 1));
    return count + 1;
  } catch {
    return 0;
  }
}

function isDismissedRecently(): boolean {
  try {
    const at = parseInt(localStorage.getItem(DISMISSED_AT_KEY) ?? '', 10);
    return Number.isFinite(at) && Date.now() - at < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function isInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Decides whether (and how) to offer "add to home screen":
 * - `platform === 'native'` — Chromium captured `beforeinstallprompt`; call
 *   `promptInstall()` to show the browser's install dialog.
 * - `platform === 'ios'` — iOS Safari has no install API; show manual steps.
 * - `platform === null` — don't show anything (already installed/standalone,
 *   dismissed recently, webview, or first-ever session).
 */
export function usePWAInstall() {
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    subscribers.add(forceUpdate);
    return () => {
      subscribers.delete(forceUpdate);
    };
  }, [forceUpdate]);

  useEffect(() => {
    bumpSessionCount();
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    } catch { /* storage unavailable */ }
    forceUpdate();
  }, [forceUpdate]);

  const promptInstall = useCallback(async () => {
    const evt = deferredPrompt;
    if (!evt) return;
    // The event is single-use; drop it regardless of the user's choice.
    deferredPrompt = null;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === 'dismissed') {
      try {
        localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
      } catch { /* storage unavailable */ }
    }
    forceUpdate();
  }, [forceUpdate]);

  let platform: InstallPlatform | null = null;
  let enoughSessions = false;
  try {
    enoughSessions =
      (parseInt(localStorage.getItem(SESSION_COUNT_KEY) ?? '0', 10) || 0) >= MIN_SESSIONS;
  } catch { /* storage unavailable */ }

  if (
    enoughSessions &&
    !isStandalone() &&
    !isInstalled() &&
    !isDismissedRecently() &&
    !isWebview()
  ) {
    if (deferredPrompt) platform = 'native';
    else if (isIOS()) platform = 'ios';
  }

  return { platform, promptInstall, dismiss };
}
