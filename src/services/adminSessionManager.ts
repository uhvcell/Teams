/**
 * UHV Cell – NBKRIST
 * Centralized Administrator Session & Inactivity Governance
 *
 * Security Policies Enforced:
 * 1. Isolated Session Storage (tab/window scoped sessionStorage instead of permanent localStorage)
 * 2. 10-Minute Inactivity Expiration (auto-signout via Firebase Auth & redirect to login)
 * 3. Activity Tracking (mouse, keyboard, touch, click, scroll)
 * 4. Shared Device Protection (immediate purge on browser/tab close or timeout)
 * 5. Visitor Isolation (public visitors never receive admin flags or status)
 */

import { firebaseAuthService } from './firebase';

export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const SESSION_FLAG_KEY = 'uhv_admin_session';
const SESSION_EMAIL_KEY = 'uhv_admin_email';
const SESSION_TOKEN_KEY = 'uhv_admin_token';
const SESSION_LAST_ACTIVE_KEY = 'uhv_admin_last_active';
const SESSION_LOGIN_TIME_KEY = 'uhv_admin_login_time';
const SESSION_TIMED_OUT_NOTICE_KEY = 'uhv_admin_session_timed_out';

let inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastRecordedActivityTime = 0;
let isListenersAttached = false;
let timeoutCallbacks: Array<() => void> = [];

/**
 * Remove any legacy administrative credentials stored in localStorage
 * to ensure shared devices and mobile phones do not retain stale admin access.
 */
export function purgeLegacyLocalStorageAdminData(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_FLAG_KEY);
      localStorage.removeItem(SESSION_EMAIL_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem('uhv_admin_session_token');
    }
  } catch (err) {
    console.warn('[Session Security] Warning purging legacy storage:', err);
  }
}

/**
 * Checks whether an administrator session is currently active and valid.
 * Checks validity against the 10-minute inactivity limit.
 */
export function isAdminSessionActive(): boolean {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }

  // Session must exist in sessionStorage (tab-scoped)
  const isFlagged = sessionStorage.getItem(SESSION_FLAG_KEY) === 'true';
  if (!isFlagged) {
    return false;
  }

  const lastActiveStr = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
  if (!lastActiveStr) {
    // Missing activity timestamp; treat as invalid
    clearAdminSession();
    return false;
  }

  const lastActive = parseInt(lastActiveStr, 10);
  if (isNaN(lastActive) || Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
    // Session has expired due to inactivity
    handleInactivityTimeout();
    return false;
  }

  return true;
}

/**
 * Retrieves the currently authenticated administrator email from sessionStorage.
 */
export function getAdminSessionEmail(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(SESSION_EMAIL_KEY) || '';
}

/**
 * Retrieves the currently authenticated administrator backend JWT from sessionStorage.
 */
export function getAdminSessionToken(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
}

/**
 * Stores the authenticated administrator credentials in sessionStorage
 * and initializes the 10-minute inactivity tracking.
 */
export function setAdminSession(email: string, token?: string): void {
  if (typeof sessionStorage === 'undefined') return;

  const now = Date.now();
  sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
  sessionStorage.setItem(SESSION_EMAIL_KEY, email);
  sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
  sessionStorage.setItem(SESSION_LOGIN_TIME_KEY, now.toString());
  sessionStorage.removeItem(SESSION_TIMED_OUT_NOTICE_KEY);

  if (token) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  }

  // Always purge legacy localStorage admin items
  purgeLegacyLocalStorageAdminData();

  // Start activity listeners and interval
  startInactivityMonitoring();

  // Notify listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('uhv_auth_state_changed'));
  }
}

/**
 * Clears administrator session data from sessionStorage and localStorage.
 */
export function clearAdminSession(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
    sessionStorage.removeItem(SESSION_LOGIN_TIME_KEY);
  }

  purgeLegacyLocalStorageAdminData();
  stopInactivityMonitoring();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('uhv_auth_state_changed'));
  }
}

/**
 * Records user activity (mouse, keyboard, touch, clicks, scroll) and updates last-active timestamp.
 * Throttled to at most once per second for optimal performance.
 */
export function recordAdminActivity(): void {
  const now = Date.now();
  if (now - lastRecordedActivityTime < 1000) {
    return; // Throttled
  }
  lastRecordedActivityTime = now;

  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_FLAG_KEY) === 'true') {
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
  }
}

/**
 * Handles inactivity timeout trigger: signs out of Firebase, clears tokens,
 * sets a timeout banner flag for the login screen, and alerts subscribers.
 */
export async function handleInactivityTimeout(): Promise<void> {
  console.info('[Session Security] Administrator session expired after 10 minutes of inactivity.');

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_TIMED_OUT_NOTICE_KEY, 'true');
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
  }

  purgeLegacyLocalStorageAdminData();
  stopInactivityMonitoring();

  // Sign out from Firebase Auth and backend
  try {
    await firebaseAuthService.logout();
  } catch (err) {
    console.warn('[Session Security] Error signing out on timeout:', err);
  }

  // Trigger timeout callbacks
  timeoutCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.warn('[Session Security] Error in timeout callback:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('uhv_admin_session_expired', {
      detail: { reason: 'inactivity_10m' },
    }));
    window.dispatchEvent(new Event('uhv_auth_state_changed'));
  }
}

/**
 * Check if the last logout occurred due to an inactivity timeout.
 * Consuming this check clears the flag.
 */
export function consumeInactivityTimeoutNotice(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const timedOut = sessionStorage.getItem(SESSION_TIMED_OUT_NOTICE_KEY) === 'true';
  if (timedOut) {
    sessionStorage.removeItem(SESSION_TIMED_OUT_NOTICE_KEY);
  }
  return timedOut;
}

/**
 * Registers an inactivity timeout callback.
 */
export function onAdminSessionTimeout(callback: () => void): () => void {
  timeoutCallbacks.push(callback);
  return () => {
    timeoutCallbacks = timeoutCallbacks.filter((cb) => cb !== callback);
  };
}

const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

function handleUserActivity() {
  if (isAdminSessionActive()) {
    recordAdminActivity();
  }
}

/**
 * Starts global activity monitoring and periodic timeout checks.
 */
export function startInactivityMonitoring(): void {
  if (typeof window === 'undefined') return;

  if (!isListenersAttached) {
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });
    isListenersAttached = true;
  }

  if (inactivityCheckInterval) {
    clearInterval(inactivityCheckInterval);
  }

  // Check every 3 seconds for inactivity expiry
  inactivityCheckInterval = setInterval(() => {
    if (typeof sessionStorage === 'undefined') return;
    const isFlagged = sessionStorage.getItem(SESSION_FLAG_KEY) === 'true';
    if (!isFlagged) {
      stopInactivityMonitoring();
      return;
    }

    const lastActiveStr = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    if (!lastActiveStr) {
      handleInactivityTimeout();
      return;
    }

    const lastActive = parseInt(lastActiveStr, 10);
    if (isNaN(lastActive) || Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
      handleInactivityTimeout();
    }
  }, 3000);
}

/**
 * Stops activity listeners and interval timer.
 */
export function stopInactivityMonitoring(): void {
  if (inactivityCheckInterval) {
    clearInterval(inactivityCheckInterval);
    inactivityCheckInterval = null;
  }

  if (isListenersAttached && typeof window !== 'undefined') {
    activityEvents.forEach((ev) => {
      window.removeEventListener(ev, handleUserActivity);
    });
    isListenersAttached = false;
  }
}

// Automatically purge legacy localStorage admin items on script initialization
if (typeof window !== 'undefined') {
  purgeLegacyLocalStorageAdminData();
  // If session is already active in sessionStorage, start monitoring
  if (isAdminSessionActive()) {
    startInactivityMonitoring();
  }
}
