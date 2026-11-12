import React, { useState } from 'react';
import { WebsiteConfig, CoreValueItem, AnnouncementItem, EventItem, CustomStatItem } from '../../../types';
import {
  Sparkles,
  Layers,
  Bell,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Eye,
  BarChart3,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HomepageTabProps {
  config: WebsiteConfig;
  onChange: (updated: WebsiteConfig) => void;
}

export const HomepageTab: React.FC<HomepageTabProps> = ({ config, onChange }) => {
  const [subSection, setSubSection] = useState<'hero' | 'stats' | 'values' | 'announcements' | 'events'>('hero');

  // Announcement state
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [newAnn, setNewAnn] = useState<Partial<AnnouncementItem>>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    content: '',
    badge: 'Important',
    isPublished: true,
  });

  // Event state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<EventItem>>({
    title: '',
    date: '',
    time: '',
    venue: '',
    speaker: '',
    description: '',
    isUpcoming: true,
  });

  // Stat state
  const [newStat, setNewStat] = useState<Partial<CustomStatItem>>({
    label: '',
    value: '',
    subtext: '',
  });

  const updateHero = (field: keyof WebsiteConfig['hero'], value: any) => {
    onChange({
      ...config,
      hero: {
        ...config.hero,
        [field]: value,
      },
    });
  };

  // Add / Delete Custom Stat
  const handleAddStat = () => {
    if (!newStat.label || !newStat.value) return;
    const item: CustomStatItem = {
      id: 'cs-' + Date.now().toString(36),
      label: newStat.label,
      value: newStat.value,
      subtext: newStat.subtext,
    };
    updateHero('customStats', [...config.hero.customStats, item]);
    setNewStat({ label: '', value: '', subtext: '' });
  };

  const handleDeleteStat = (id: string) => {
    updateHero(
      'customStats',
      config.hero.customStats.filter((s) => s.id !== id)
    );
  };

  // Core Value Edit
  const handleUpdateValue = (id: string, field: keyof CoreValueItem, value: any) => {
    const updated = config.values.map((v) => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    });
    onChange({ ...config, values: updated });
  };

  // Announcement Handlers
  const handleSaveAnnouncement = () => {
    if (!newAnn.title || !newAnn.content) return;

    if (editingAnnId) {
      const updated = config.announcements.map((a) => {
        if (a.id === editingAnnId) {
          return {
            ...a,
            ...newAnn,
          } as AnnouncementItem;
        }
        return a;
      });
      onChange({ ...config, announcements: updated });
      setEditingAnnId(null);
    } else {
      const created: AnnouncementItem = {
        id: 'ann-' + Date.now().toString(36),
        title: newAnn.title || '',
        date: newAnn.date || new Date().toISOString().slice(0, 10),
        content: newAnn.content || '',
        badge: newAnn.badge || 'New',
        isPublished: newAnn.isPublished ?? true,
        linkUrl: newAnn.linkUrl,
      };
      onChange({ ...config, announcements: [created, ...config.announcements] });
    }

    setNewAnn({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      content: '',
      badge: 'Important',
      isPublished: true,
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    onChange({
      ...config,
      announcements: config.announcements.filter((a) => a.id !== id),
    });
  };

  const handleToggleAnnPublished = (id: string) => {
    onChange({
      ...config,
      announcements: config.announcements.map((a) =>
        a.id === id ? { ...a, isPublished: !a.isPublished } : a
      ),
    });
  };

  // Event Handlers
  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    if (editingEventId) {
      const updated = config.events.map((e) => {
        if (e.id === editingEventId) {
          return {
            ...e,
            ...newEvent,
          } as EventItem;
        }
        return e;
      });
      onChange({ ...config, events: updated });
      setEditingEventId(null);
    } else {
      const created: EventItem = {
        id: 'ev-' + Date.now().toString(36),
        title: newEvent.title || '',
        date: newEvent.date || '',
        time: newEvent.time || '',
        venue: newEvent.venue || '',
        speaker: newEvent.speaker,
        description: newEvent.description || '',
        registrationUrl: newEvent.registrationUrl,
        isUpcoming: newEvent.isUpcoming ?? true,
      };
      onChange({ ...config, events: [...config.events, created] });
    }

    setNewEvent({
      title: '',
      date: '',
      time: '',
      venue: '',
      speaker: '',
      description: '',
      isUpcoming: true,
    });
  };

  const handleDeleteEvent = (id: string) => {
    onChange({
      ...config,
      events: config.events.filter((e) => e.id !== id),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Subnavigation Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubSection('hero')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            subSection === 'hero' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Hero Banner</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('stats')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            subSection === 'stats' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Quick Stats ({config.hero.customStats.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('values')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            subSection === 'values' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>9 Values of Relationship ({config.values.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('announcements')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            subSection === 'announcements' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notice Board ({config.announcements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('events')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
            subSection === 'events' ? 'bg-white text-[#0f2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events & Workshops ({config.events.length})</span>
        </button>
      </div>

      {/* 1. HERO BANNER SETTINGS */}
      {subSection === 'hero' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Homepage Hero & Main Showcase
            </h3>
            <p className="text-xs text-slate-500">
              Configure the primary introductory section, headlines, institutional badges, and CTA buttons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Top Badge Text
              </label>
              <input
                type="text"
                value={config.hero.badgeText}
                onChange={(e) => updateHero('badgeText', e.target.value)}
                placeholder="e.g. AICTE UHV MANDATED INITIATIVE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Title Headline
              </label>
              <input
                type="text"
                value={config.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                placeholder="e.g. UHV CELL – NBKRIST"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-serif font-bold focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Subtitle
              </label>
              <input
                type="text"
                value={config.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                placeholder="e.g. Universal Human Values Cell"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Core Motto Quote
              </label>
              <input
                type="text"
                value={config.hero.quote}
                onChange={(e) => updateHero('quote', e.target.value)}
                placeholder="e.g. “Building Understanding, Responsibility and Co-Existence”"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-serif italic focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hero Narrative Description
              </label>
              <textarea
                rows={3}
                value={config.hero.description}
                onChange={(e) => updateHero('description', e.target.value)}
                placeholder="Brief summary of the cell's educational purpose and value workshops."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary CTA Button Text
              </label>
              <input
                type="text"
                value={config.hero.primaryCtaText}
                onChange={(e) => updateHero('primaryCtaText', e.target.value)}
                placeholder="e.g. SCAN / VERIFY MEMBER"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Secondary CTA Button Text
              </label>
              <input
                type="text"
                value={config.hero.secondaryCtaText}
                onChange={(e) => updateHero('secondaryCtaText', e.target.value)}
                placeholder="e.g. ADMIN LOGIN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. STATS & METRICS */}
      {subSection === 'stats' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Homepage Metrics & Impact Counters
              </h3>
              <p className="text-xs text-slate-500">
                Display verified statistics highlighting institutional reach, SIP workshops, and student mentorship.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.hero.showStatsBar}
                onChange={(e) => updateHero('showStatsBar', e.target.checked)}
                className="w-4 h-4 rounded-sm text-[#0f2942] focus:ring-[#0f2942]"
              />
              <span>Display Stats Section on Homepage</span>
            </label>
          </div>

          {/* Existing Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {config.hero.customStats.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl font-bold text-[#0f2942] font-mono">{st.value}</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">{st.label}</div>
                  {st.subtext && <div className="text-[10px] text-slate-500 mt-0.5">{st.subtext}</div>}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteStat(st.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                  title="Remove Stat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Stat */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-dashed border-slate-300">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Add New Metric Stat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Stat Value (e.g. 48+)"
                value={newStat.value || ''}
                onChange={(e) => setNewStat({ ...newStat, value: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Stat Label (e.g. Workshops Held)"
                value={newStat.label || ''}
                onChange={(e) => setNewStat({ ...newStat, label: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Subtext (e.g. Across departments)"
                  value={newStat.subtext || ''}
                  onChange={(e) => setNewStat({ ...newStat, subtext: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 9 VALUES OF RELATIONSHIP */}
      {subSection === 'values' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              The 9 Values of Relationship (Universal Human Values)
            </h3>
            <p className="text-xs text-slate-500">
              AICTE prescribed universal values for human-to-human relationships: Trust (Vishwas), Respect (Samman), Affection, Care, Guidance, Reverence, Glory, Gratitude, and Love (Prem).
            </p>
          </div>

          <div className="space-y-4">
            {config.values.map((val, idx) => (
              <div
                key={val.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                <div className="md:col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0f2942] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <input
                        type="text"
                        value={val.name}
                        onChange={(e) => handleUpdateValue(val.id, 'name', e.target.value)}
                        className="text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-[#0f2942] focus:outline-hidden w-full"
                      />
                      <input
                        type="text"
                        value={val.englishMeaning}
                        onChange={(e) => handleUpdateValue(val.id, 'englishMeaning', e.target.value)}
                        placeholder="Indian/Sanskrit term"
                        className="text-xs font-semibold text-amber-700 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-700 focus:outline-hidden mt-1 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <textarea
                    rows={2}
                    value={val.description}
                    onChange={(e) => handleUpdateValue(val.id, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#0f2942]"
                  />
                </div>

                <div className="md:col-span-2">
                  <select
                    value={val.category}
                    onChange={(e) => handleUpdateValue(val.id, 'category', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="Foundational">Foundational</option>
                    <option value="Operational">Operational</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ANNOUNCEMENTS / NOTICE BOARD */}
      {subSection === 'announcements' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Announcements & Notice Board Management
            </h3>
            <p className="text-xs text-slate-500">
              Publish critical notices, workshop dates, and induction announcements directly on the homepage.
            </p>
          </div>

          {/* Form to Add / Edit Announcement */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {editingAnnId ? 'Edit Announcement' : 'Post New Announcement'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newAnn.title || ''}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  placeholder="e.g. Student Induction Program 2026–27 Schedule"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Badge Label
                </label>
                <select
                  value={newAnn.badge}
                  onChange={(e) => setNewAnn({ ...newAnn, badge: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Important">Important</option>
                  <option value="New">New</option>
                  <option value="Notice">Notice</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Announcement Details / Description
                </label>
                <textarea
                  rows={2}
                  value={newAnn.content || ''}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  placeholder="Full text of the announcement..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAnn.isPublished}
                  onChange={(e) => setNewAnn({ ...newAnn, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-[#0f2942]"
                />
                <span>Publish Immediately</span>
              </label>

              <div className="flex gap-2">
                {editingAnnId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnnId(null);
                      setNewAnn({
                        title: '',
                        date: new Date().toISOString().slice(0, 10),
                        content: '',
                        badge: 'Important',
                        isPublished: true,
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingAnnId ? 'Update Announcement' : 'Post Announcement'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Announcements */}
          <div className="space-y-3">
            {config.announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  ann.isPublished ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
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
                    {!ann.isPublished && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm">
                        Hidden
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                  <p className="text-xs text-slate-600">{ann.content}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleAnnPublished(ann.id)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xs"
                    title={ann.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnnId(ann.id);
                      setNewAnn(ann);
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xs"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 text-xs"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. UPCOMING EVENTS & WORKSHOPS */}
      {subSection === 'events' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Upcoming Events, Seminars & Field Activities
            </h3>
            <p className="text-xs text-slate-500">
              Manage the event calendar for campus workshops, mentor circles, and nature walks.
            </p>
          </div>

          {/* New Event Form */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {editingEventId ? 'Edit Event' : 'Add New Event or Workshop'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Harmony in Human Relationships Seminar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={newEvent.date || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  placeholder="e.g. October 12, 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={newEvent.time || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  placeholder="e.g. 10:00 AM – 1:00 PM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={newEvent.venue || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="e.g. Auditorium Block A, NBKRIST"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Speaker / Resource Person
                </label>
                <input
                  type="text"
                  value={newEvent.speaker || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, speaker: e.target.value })}
                  placeholder="e.g. Prof. R. R. Gaur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Summary of session objectives..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingEventId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEventId(null);
                    setNewEvent({
                      title: '',
                      date: '',
                      time: '',
                      venue: '',
                      speaker: '',
                      description: '',
                      isUpcoming: true,
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveEvent}
                className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingEventId ? 'Update Event' : 'Save Event'}</span>
              </button>
            </div>
          </div>

          {/* Existing Events List */}
          <div className="space-y-3">
            {config.events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>{ev.date}</span>
                    {ev.time && <span>• {ev.time}</span>}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-500">
                    Venue: {ev.venue} {ev.speaker && `• Speaker: ${ev.speaker}`}
                  </p>
                  <p className="text-xs text-slate-600 italic mt-1">&ldquo;{ev.description}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEventId(ev.id);
                      setNewEvent(ev);
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xs"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 text-xs"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
