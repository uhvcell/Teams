import React, { useState, useEffect } from 'react';
import { UHVLogo } from './UHVLogo';
import { ShieldCheck, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { firebaseAuthService, firestoreAdminsService } from '../services/firebase';
import { setAdminSession, consumeInactivityTimeoutNotice } from '../services/adminSessionManager';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if redirected here due to 10-minute inactivity expiration
    if (consumeInactivityTimeoutNotice()) {
      setSessionNotice('Your administrator session expired after 10 minutes of inactivity. Please sign in again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide valid admin credentials.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSessionNotice(null);

    try {
      // Authenticate administrator via Firebase Authentication
      const user = await firebaseAuthService.loginWithEmail(email.trim(), password);

      // Record login in Firestore admins collection
      await firestoreAdminsService.saveAdmin({
        id: user.uid,
        name: user.displayName || email.trim().split('@')[0],
        email: user.email || email.trim(),
        role: 'Super Admin',
        status: 'Active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      let backendToken: string | undefined;

      // Synchronize backend administrator session token
      try {
        const authRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email || email.trim(), password }),
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.token) {
            backendToken = authData.token;
          }
        }
      } catch {
        // Fallback token handled on-demand by qrService
      }

      // Establish tab-scoped admin session with 10-minute inactivity timer
      setAdminSession(user.email || email.trim(), backendToken);

      onLoginSuccess();
    } catch (err: unknown) {
      console.warn('Admin sign-in error:', err);
      const firebaseError = err as { code?: string; message?: string };
      if (
        firebaseError?.code === 'auth/wrong-password' ||
        firebaseError?.code === 'auth/invalid-credential' ||
        firebaseError?.code === 'auth/user-not-found'
      ) {
        setError('Invalid administrator email or security password.');
      } else if (firebaseError?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (firebaseError?.code === 'auth/too-many-requests') {
        setError('Access temporarily disabled due to multiple failed login attempts. Please try again later.');
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Invalid administrator credentials.';
        setError(errorMsg.includes('auth/') ? 'Authentication failed. Please verify your credentials.' : errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setSessionNotice(null);
    try {
      const user = await firebaseAuthService.loginWithGoogle();

      // Record in Firestore admins collection
      await firestoreAdminsService.saveAdmin({
        id: user.uid,
        name: user.displayName || 'Authorized Admin',
        email: user.email || '',
        role: 'Super Admin',
        status: 'Active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      let backendToken: string | undefined;

      // Synchronize backend administrator session token
      try {
        const authRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email || 'admin.uhv@nbkrist.org', googleAuth: true }),
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.token) {
            backendToken = authData.token;
          }
        }
      } catch {
        // Fallback token handled on-demand by qrService
      }

      // Establish tab-scoped admin session with 10-minute inactivity timer
      setAdminSession(user.email || 'Admin', backendToken);

      onLoginSuccess();
    } catch (err: unknown) {
      console.warn('Google sign-in error:', err);
      const firebaseError = err as { code?: string };
      if (firebaseError?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in window was closed.');
      } else {
        setError('Google Sign-In was cancelled or not configured in Firebase console.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2942] via-[#163c62] to-[#0f2942] text-white p-6 sm:p-8 text-center border-b-4 border-amber-400">
          <div className="p-2 bg-white rounded-full inline-block shadow-md mb-3">
            <UHVLogo size="md" />
          </div>
          <h2 className="text-xl font-serif font-bold text-white">
            UHV CELL – NBKRIST
          </h2>
          <p className="text-xs text-amber-300 font-medium mt-0.5">
            Universal Human Values Cell • Administrator Portal
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700 text-[11px]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Authorized Personnel Only</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h3 className="font-bold text-lg text-slate-900">
              Administrator Sign In
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Authorized access to member registration, token governance, and website CMS.
            </p>
          </div>

          {sessionNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{sessionNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Google Sign-in Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 mb-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Institutional Google Account
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-[11px] uppercase tracking-wider">or sign in with email</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="uhvcell@nbkrist"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In as Administrator'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

