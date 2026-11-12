import React, { useState } from 'react';
import { UHVLogo } from './UHVLogo';
import { storageService } from '../services/storage';
import {
  QrCode,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  BookOpen,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Megaphone,
  Users,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdmin: boolean;
  onAdminLogout: () => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdmin,
  onAdminLogout,
  onOpenScanner,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = storageService.getPublishedConfig();

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const primaryColor = config.appearance.primaryColor || '#0f2942';
  const accentColor = config.appearance.accentColor || '#f59e0b';

  return (
    <>
      {/* Dynamic Top Announcement Ticker Bar */}
      {config.appearance.topBannerEnabled && (
        <div
          className="py-1.5 px-4 text-xs flex items-center justify-center gap-2 text-white font-medium text-center z-50 transition-colors shadow-2xs"
          style={{ backgroundColor: primaryColor }}
        >
          {config.appearance.topBannerBadge && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900 tracking-wider uppercase shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {config.appearance.topBannerBadge}
            </span>
          )}
          <span className="truncate max-w-2xl">{config.appearance.topBannerText}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Title */}
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 text-left group focus:outline-hidden"
            >
              <UHVLogo size="md" />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-[#0f2942] transition-colors">
                  {config.branding.websiteTitle || 'UHV CELL – NBKRIST'}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-tight">
                  {config.branding.tagline || 'Universal Human Values Cell'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => handleNav('home')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-slate-100 text-[#0f2942] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </button>

              <button
                onClick={onOpenScanner}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[#0f2942] bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-colors shadow-2xs"
              >
                <QrCode className="w-4 h-4 text-amber-700" />
                Scan / Verify Member
              </button>

              <button
                onClick={() => handleNav('team')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'team'
                    ? 'bg-slate-100 text-[#0f2942] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-slate-500" />
                Our Team
              </button>

              <button
                onClick={() => handleNav('values')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'values'
                    ? 'bg-slate-100 text-[#0f2942] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                Human Values
              </button>

              <button
                onClick={() => handleNav('feedback')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'feedback'
                    ? 'bg-slate-100 text-[#0f2942] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Student Feedback
              </button>

              {/* Admin Actions: Visible only inside Admin View for verified admins; Visitors always see normal public portal */}
              {isAdmin && currentView === 'admin' ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => handleNav('admin')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-[#0f2942] hover:bg-[#163a5e] shadow-xs transition-colors ring-2 ring-amber-400"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </button>
                  <button
                    onClick={onAdminLogout}
                    title="Logout Administrator"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNav(isAdmin ? 'admin' : 'login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-[#0f2942] hover:bg-[#1a3f65] shadow-xs transition-colors ml-2"
                >
                  <UserCheck className="w-4 h-4 text-amber-300" />
                  Admin Login
                </button>
              )}
            </nav>

            {/* Mobile Menu Trigger */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenScanner}
                className="p-2 rounded-xl bg-amber-100 text-[#0f2942]"
                title="Scan QR"
              >
                <QrCode className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <button
              onClick={() => handleNav('home')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenScanner();
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#0f2942] bg-amber-50"
            >
              <QrCode className="w-4 h-4 text-amber-700" />
              Scan / Verify Member
            </button>
            <button
              onClick={() => handleNav('team')}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              <Users className="w-4 h-4 text-slate-500" />
              Our Team
            </button>
            <button
              onClick={() => handleNav('values')}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              Human Values & Co-Existence
            </button>
            <button
              onClick={() => handleNav('feedback')}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Anonymous Student Feedback
            </button>

            <div className="pt-2 border-t border-slate-100">
              {isAdmin && currentView === 'admin' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleNav('admin')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0f2942]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </button>
                  <button
                    onClick={() => {
                      onAdminLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout Administrator
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNav(isAdmin ? 'admin' : 'login')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0f2942]"
                >
                  <UserCheck className="w-4 h-4 text-amber-300" />
                  Admin Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
