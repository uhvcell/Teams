import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { StudentProfile } from './components/StudentProfile';
import { InvalidMember } from './components/InvalidMember';
import { QRScannerModal } from './components/QRScannerModal';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ValuesView } from './components/ValuesView';
import { StudentFeedbackView } from './components/StudentFeedbackView';
import { OurTeamSection } from './components/OurTeamSection';
import { storageService } from './services/storage';
import { firebaseAuthService } from './services/firebase';
import { Member } from './types';
import {
  isAdminSessionActive,
  onAdminSessionTimeout,
  clearAdminSession,
} from './services/adminSessionManager';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [invalidReason, setInvalidReason] = useState<'not_found' | 'inactive'>('not_found');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminSessionActive());
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Helper to parse route from current window.location
  const parseRoute = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // Check for /verify/:qrId, #verify/:qrId, /student/:token, or #student/:token
    let rawToken = '';
    if (path.includes('/verify/')) {
      rawToken = path.split('/verify/')[1].split('/')[0].split('?')[0];
    } else if (hash.includes('#verify/')) {
      rawToken = hash.split('#verify/')[1].split('/')[0].split('?')[0];
    } else if (path.includes('/student/')) {
      rawToken = path.split('/student/')[1].split('/')[0].split('?')[0];
    } else if (hash.includes('#student/')) {
      rawToken = hash.split('#student/')[1].split('/')[0].split('?')[0];
    }

    if (rawToken) {
      const cleanToken = decodeURIComponent(rawToken).trim();
      if (cleanToken) {
        verifyAndOpenProfile(cleanToken, false);
        return;
      }
    }

    if (path === '/admin' || hash === '#admin') {
      const active = isAdminSessionActive();
      setIsAdmin(active);
      setCurrentView(active ? 'admin' : 'login');
      return;
    }

    if (path === '/feedback' || hash === '#feedback') {
      setCurrentView('feedback');
      return;
    }

    if (path === '/values' || hash === '#values') {
      setCurrentView('values');
      return;
    }

    if (path === '/team' || hash === '#team' || hash === '#our-team') {
      setCurrentView('team');
      return;
    }

    if (path === '/login' || hash === '#login') {
      const active = isAdminSessionActive();
      setIsAdmin(active);
      setCurrentView(active ? 'admin' : 'login');
      return;
    }

    setCurrentView('home');
    setActiveToken(null);
    setActiveMember(null);
    setIsInvalidToken(false);
  };

  useEffect(() => {
    // Initial cleanup & recovery: restore all legitimate students and remove AI mock data
    storageService.purgeAiMockData();

    // Initial sync with Firebase Cloud Firestore
    storageService.syncWithCloudFirestore().catch(() => {});

    // Subscribe to automatic 10-minute inactivity session timeout
    const unsubTimeout = onAdminSessionTimeout(() => {
      setIsAdmin(false);
      setCurrentView('login');
      window.history.pushState({}, '', '#login');
    });

    // Listen for auth state changes (login, logout, tab session changes)
    const handleAuthStateChanged = () => {
      const active = isAdminSessionActive();
      setIsAdmin(active);
      if (!active && currentView === 'admin') {
        setCurrentView('login');
        window.history.pushState({}, '', '#login');
      }
    };
    window.addEventListener('uhv_auth_state_changed', handleAuthStateChanged);

    // Listen for Firebase Auth state
    const unsubscribeFirebase = firebaseAuthService.onAuthChanged((user) => {
      if (user) {
        if (isAdminSessionActive()) {
          setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
      }
    });

    parseRoute();

    const handlePopState = () => {
      parseRoute();
    };

    const handlePageShow = () => {
      // Re-verify session validity if browser restores from bfcache (Back button)
      const active = isAdminSessionActive();
      setIsAdmin(active);
      if (!active && (window.location.pathname === '/admin' || window.location.hash === '#admin')) {
        setCurrentView('login');
        window.history.replaceState({}, '', '#login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('uhv_auth_state_changed', handleAuthStateChanged);
      unsubscribeFirebase();
      unsubTimeout();
    };
  }, [currentView]);

  const verifyAndOpenProfile = (token: string, pushHistory = true) => {
    const cleanToken = decodeURIComponent(token).trim();
    if (!cleanToken) {
      setIsInvalidToken(true);
      setInvalidReason('not_found');
      setCurrentView('invalid');
      return;
    }

    // Set view to loading while querying direct Cloud Firestore document
    setCurrentView('loading');
    setIsInvalidToken(false);
    setActiveToken(cleanToken);

    if (pushHistory) {
      window.history.pushState({}, '', `/verify/${cleanToken}`);
    }

    // Query Cloud Firestore directly as single source of truth
    storageService
      .fetchMemberByTokenAsync(cleanToken)
      .then((member) => {
        if (member) {
          if (member.status === 'Inactive') {
            setIsInvalidToken(true);
            setInvalidReason('inactive');
            setActiveMember(member);
            setCurrentView('invalid');
          } else {
            setIsInvalidToken(false);
            setActiveMember(member);
            setCurrentView('profile');
          }
        } else {
          setIsInvalidToken(true);
          setInvalidReason('not_found');
          setActiveMember(null);
          setCurrentView('invalid');
        }
      })
      .catch((err) => {
        console.warn('[Verification] Error loading certificate record:', err);
        setIsInvalidToken(true);
        setInvalidReason('not_found');
        setActiveMember(null);
        setCurrentView('invalid');
      });
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setActiveToken(null);
    setActiveMember(null);
    setIsInvalidToken(false);

    if (view === 'home') {
      window.history.pushState({}, '', '/');
    } else if (view === 'team') {
      window.history.pushState({}, '', '#team');
    } else if (view === 'admin') {
      if (!isAdminSessionActive()) {
        setCurrentView('login');
        setIsAdmin(false);
        window.history.pushState({}, '', '#login');
        return;
      }
      window.history.pushState({}, '', '#admin');
    } else if (view === 'values') {
      window.history.pushState({}, '', '#values');
    } else if (view === 'feedback') {
      window.history.pushState({}, '', '#feedback');
    } else if (view === 'login') {
      window.history.pushState({}, '', '#login');
    }
  };

  const handleAdminLogout = async () => {
    clearAdminSession();
    await firebaseAuthService.logout();
    setIsAdmin(false);
    handleNavigate('home');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setCurrentView('admin');
    window.history.pushState({}, '', '#admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Institutional Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        isAdmin={isAdmin}
        onAdminLogout={handleAdminLogout}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main App Canvas */}
      <main className="flex-1">
        {/* VIEW 0: Loading verification state */}
        {currentView === 'loading' && (
          <div className="w-full max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#0f2942] border-t-amber-400 rounded-full animate-spin mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-1">Verifying UHV Member</h2>
              <p className="text-sm text-slate-500">
                Retrieving verified student profile from UHV Cell records...
              </p>
            </div>
          </div>
        )}

        {/* VIEW 1: Member Profile (When verified via secure random token) */}
        {currentView === 'profile' && activeMember && (
          <StudentProfile
            member={activeMember}
            isAdmin={isAdmin}
            onBack={() => handleNavigate('home')}
          />
        )}

        {/* VIEW 2: Invalid Member / Token Not Found / Inactive */}
        {currentView === 'invalid' && (
          <InvalidMember
            reason={invalidReason}
            onBack={() => handleNavigate('home')}
            onScanAnother={() => setIsScannerOpen(true)}
          />
        )}

        {/* VIEW 3: Homepage */}
        {currentView === 'home' && (
          <Home
            onOpenScanner={() => setIsScannerOpen(true)}
            onNavigate={handleNavigate}
            onSelectMemberForTest={(token) => verifyAndOpenProfile(token, true)}
          />
        )}

        {/* VIEW 4: Admin Login */}
        {(currentView === 'login' || (currentView === 'admin' && !isAdmin)) && (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onCancel={() => handleNavigate('home')}
          />
        )}

        {/* VIEW 5: Admin Dashboard */}
        {currentView === 'admin' && isAdmin && (
          <AdminDashboard
            onLogout={handleAdminLogout}
            onViewProfile={(token) => verifyAndOpenProfile(token, true)}
          />
        )}

        {/* VIEW 6: UHV Values & Co-Existence Educational Framework */}
        {currentView === 'values' && <ValuesView />}

        {/* VIEW 7: Anonymous Student Feedback & Progress Tracking */}
        {currentView === 'feedback' && <StudentFeedbackView />}

        {/* VIEW 8: Our Team - Organized by Position / Team */}
        {currentView === 'team' && (
          <div className="w-full">
            <OurTeamSection onSelectMember={(token) => verifyAndOpenProfile(token, true)} />
          </div>
        )}
      </main>

      {/* Institutional Footer */}
      <Footer />

      {/* Live QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(token) => verifyAndOpenProfile(token, true)}
      />
    </div>
  );
}
