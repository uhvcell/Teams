import React from 'react';
import { UHVLogo } from './UHVLogo';
import { OurTeamSection } from './OurTeamSection';
import {
  QrCode,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Heart,
  Award,
  Sparkles,
  Bell,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { storageService } from '../services/storage';

interface HomeProps {
  onOpenScanner: () => void;
  onNavigate: (view: string) => void;
  onSelectMemberForTest: (token: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onOpenScanner,
  onNavigate,
  onSelectMemberForTest,
}) => {
  const config = storageService.getPublishedConfig();
  const stats = storageService.getStats();
  const sampleMembers = storageService.getMembers().slice(0, 3);

  const publishedAnnouncements = config.announcements.filter((a) => a.isPublished);
  const upcomingEvents = config.events.filter((e) => e.isUpcoming);

  const primaryColor = config.appearance.primaryColor || '#0f2942';

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pt-10 pb-16 sm:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Institutional Emblem & Official Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 mb-4 animate-in zoom-in-90">
              <UHVLogo size="xl" />
            </div>

            {config.hero.badgeText && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {config.hero.badgeText}
              </div>
            )}

            {/* Main Institutional Titles */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-slate-900 tracking-tight mt-1">
              {config.hero.title || config.branding.websiteTitle}
            </h1>
            <p className="text-lg sm:text-2xl font-sans font-semibold text-[#0f2942] mt-2 tracking-normal">
              {config.hero.subtitle || config.branding.tagline}
            </p>

            {/* Required Motto / Philosophy */}
            {config.hero.quote && (
              <p className="text-base sm:text-xl text-slate-600 font-serif italic mt-3 max-w-2xl mx-auto leading-relaxed">
                {config.hero.quote}
              </p>
            )}

            {config.hero.description && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
                {config.hero.description}
              </p>
            )}

            {config.branding.headerSlogan && (
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
                “{config.branding.headerSlogan}”
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onOpenScanner}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all transform active:scale-98"
            >
              <QrCode className="w-5 h-5 text-amber-400" />
              {config.hero.primaryCtaText || 'SCAN / VERIFY MEMBER'}
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border-2 border-slate-300 shadow-sm transition-all"
            >
              <UserCheck className="w-5 h-5 text-[#0f2942]" />
              {config.hero.secondaryCtaText || 'ADMIN LOGIN'}
            </button>
          </div>

          {/* Impact Counters & Statistics Bar */}
          {config.hero.showStatsBar && (
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {config.hero.customStats && config.hero.customStats.length > 0 ? (
                config.hero.customStats.map((st) => (
                  <div key={st.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="text-2xl sm:text-3xl font-bold text-[#0f2942] font-mono">{st.value}</div>
                    <div className="text-xs font-bold text-slate-700 mt-1">{st.label}</div>
                    {st.subtext && <div className="text-[10px] text-slate-400 mt-0.5">{st.subtext}</div>}
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Total Members</span>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-xs text-emerald-600 font-semibold uppercase">Active Members</span>
                    <div className="text-2xl font-bold text-emerald-700 mt-0.5">{stats.active}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-xs text-[#0f2942] font-semibold uppercase">Leadership & Teams</span>
                    <div className="text-2xl font-bold text-[#0f2942] mt-0.5">
                      {stats.total - stats.volunteers}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-xs text-amber-700 font-semibold uppercase">Volunteers</span>
                    <div className="text-2xl font-bold text-amber-800 mt-0.5">{stats.volunteers}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Announcements & Upcoming Events Section (Dynamic Notice Board) */}
      {(publishedAnnouncements.length > 0 || upcomingEvents.length > 0) && (
        <section className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Notice Board */}
              {publishedAnnouncements.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-lg">
                        Official Notice Board
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      UHV Cell Bulletins
                    </span>
                  </div>

                  <div className="space-y-3">
                    {publishedAnnouncements.slice(0, 3).map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ann.badge === 'Important'
                                ? 'bg-rose-100 text-rose-800'
                                : ann.badge === 'New'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ann.badge}
                          </span>
                          <span className="text-[11px] text-slate-400">{ann.date}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {ann.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {ann.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Workshops & Seminars */}
              {upcomingEvents.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-900">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-lg">
                        Upcoming Workshops & Seminars
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Academic Calendar
                    </span>
                  </div>

                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 space-y-1"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0f2942]">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{ev.date}</span>
                          {ev.time && <span>• {ev.time}</span>}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {ev.title}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{ev.venue}</span>
                          {ev.speaker && <span>• Res. Person: {ev.speaker}</span>}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-slate-600 italic pt-1">
                            &ldquo;{ev.description}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 9 Core Values of Relationship Showcase */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Foundations of Human Harmony
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                The 9 Universal Values in Human Relationships
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                AICTE mandated core values guiding mutual trust, ethical conduct, and unconditional respect across campus and society.
              </p>
            </div>

            <button
              onClick={() => onNavigate('values')}
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#0f2942] hover:text-white text-slate-800 text-xs font-bold transition-all shrink-0"
            >
              <span>Explore All 9 Values</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.values.slice(0, 6).map((val, idx) => (
              <div
                key={val.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {val.category}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {val.name}
                  </h3>
                  <div className="text-xs font-semibold text-amber-700 mb-2">
                    {val.englishMeaning}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIGITAL MEMBER VERIFICATION WORKFLOW */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Official Security Protocol
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            DIGITAL MEMBER VERIFICATION
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            “Scan the QR code on an official UHV Cell ID card to verify the member&apos;s digital profile.”
          </p>

          {/* Workflow Steps */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="w-8 h-8 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold text-sm mb-3">
                  1
                </span>
                <h3 className="font-bold text-sm text-slate-900 mb-1">SCAN QR CODE</h3>
                <p className="text-xs text-slate-600">
                  Scan the dynamic physical badge or digital card using any camera or smartphone.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="w-8 h-8 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold text-sm mb-3">
                  2
                </span>
                <h3 className="font-bold text-sm text-slate-900 mb-1">SECURE RANDOM TOKEN</h3>
                <p className="text-xs text-slate-600">
                  Application receives internal cryptographic token without exposing roll numbers or private IDs.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="w-8 h-8 rounded-lg bg-[#0f2942] text-white flex items-center justify-center font-bold text-sm mb-3">
                  3
                </span>
                <h3 className="font-bold text-sm text-slate-900 mb-1">DATABASE LOOKUP</h3>
                <p className="text-xs text-slate-600">
                  Instant real-time lookup confirms active standing in the official UHV Cell registry.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm mb-3">
                  4
                </span>
                <h3 className="font-bold text-sm text-emerald-950 mb-1">VERIFIED UHV MEMBER</h3>
                <p className="text-xs text-emerald-800">
                  Displays authenticated digital member profile with role, academic year, and values pledge.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0f2942] text-white font-semibold text-sm hover:bg-[#1a3a5c] shadow-md transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              Open Live QR Scanner
            </button>
          </div>
        </div>
      </section>

      {/* Dynamically Loaded & Position-Organized Our Team Section */}
      <OurTeamSection onSelectMember={onSelectMemberForTest} />

      {/* Zero ID Privacy Guarantee Card */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 rounded-3xl bg-[#0f2942] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
                Absolute Privacy & Zero Student ID Rule
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed">
                In strict adherence to institutional privacy standards, the UHV CELL NBKRIST verification portal does not store, request, or display student Roll Numbers, UHV IDs, or registration credentials. Every card is governed by a cryptographically random, hidden internal verification token.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
