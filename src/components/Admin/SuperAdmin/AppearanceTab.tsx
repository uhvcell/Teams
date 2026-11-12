import React from 'react';
import { WebsiteConfig } from '../../../types';
import { Palette, Type, Megaphone, Check, Sparkles } from 'lucide-react';

interface AppearanceTabProps {
  config: WebsiteConfig;
  onChange: (updated: WebsiteConfig) => void;
}

const THEME_PRESETS = [
  {
    id: 'classic-navy',
    name: 'Classic Navy & Amber Gold',
    primary: '#0f2942',
    accent: '#f59e0b',
    description: 'The authentic institutional dignity of NBKRIST & UHV Cell.',
  },
  {
    id: 'deep-emerald',
    name: 'Deep Emerald & Gold',
    primary: '#064e3b',
    accent: '#10b981',
    description: 'Reflecting nature harmony, environmental serenity, and organic growth.',
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue & Sun Gold',
    primary: '#1e3a8a',
    accent: '#f59e0b',
    description: 'Prestigious academic clarity and truth in education.',
  },
  {
    id: 'heritage-maroon',
    name: 'Heritage Maroon & Warm Amber',
    primary: '#831843',
    accent: '#fbbf24',
    description: 'Traditional Indian university ethos and cultural heritage.',
  },
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ config, onChange }) => {
  const updateAppearance = (field: keyof WebsiteConfig['appearance'], value: any) => {
    onChange({
      ...config,
      appearance: {
        ...config.appearance,
        [field]: value,
      },
    });
  };

  const handleApplyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    onChange({
      ...config,
      appearance: {
        ...config.appearance,
        themePreset: preset.id as any,
        primaryColor: preset.primary,
        accentColor: preset.accent,
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Theme Presets */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Color Palette & Institutional Themes
            </h2>
            <p className="text-xs text-slate-500">
              Select pre-designed institutional color harmonies or configure bespoke brand hex values.
            </p>
          </div>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEME_PRESETS.map((preset) => {
            const isSelected =
              config.appearance.themePreset === preset.id &&
              config.appearance.primaryColor.toLowerCase() === preset.primary.toLowerCase();
            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#0f2942] bg-slate-50/80 shadow-md ring-2 ring-slate-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">{preset.name}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#0f2942] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg border border-white shadow-2xs shrink-0"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-7 h-7 rounded-lg border border-white shadow-2xs shrink-0"
                    style={{ backgroundColor: preset.accent }}
                  />
                  <span className="text-[11px] font-mono text-slate-500">
                    {preset.primary} + {preset.accent}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{preset.description}</p>
              </div>
            );
          })}
        </div>

        {/* Custom Hex Color Pickers */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Custom Hex Values
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.appearance.primaryColor}
                  onChange={(e) => updateAppearance('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={config.appearance.primaryColor}
                  onChange={(e) => updateAppearance('primaryColor', e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Accent Highlight Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.appearance.accentColor}
                  onChange={(e) => updateAppearance('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={config.appearance.accentColor}
                  onChange={(e) => updateAppearance('accentColor', e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Selection */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Typography & Font Styling
            </h3>
            <p className="text-xs text-slate-500">
              Select font hierarchy for titles, slogans, quotes, and profile verification badges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => updateAppearance('fontStyle', 'academic-serif')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              config.appearance.fontStyle === 'academic-serif'
                ? 'border-[#0f2942] bg-slate-50/80 shadow-md ring-2 ring-slate-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-serif font-bold text-base text-slate-900 mb-1">
              Academic Serif
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Traditional serif headlines with modern body sans. Recommended for academic institutional dignity.
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateAppearance('fontStyle', 'clean-sans')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              config.appearance.fontStyle === 'clean-sans'
                ? 'border-[#0f2942] bg-slate-50/80 shadow-md ring-2 ring-slate-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-sans font-bold text-base text-slate-900 mb-1">
              Clean Modern Sans
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Contemporary sans-serif throughout. High legibility and modern digital feel.
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateAppearance('fontStyle', 'modern-hybrid')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              config.appearance.fontStyle === 'modern-hybrid'
                ? 'border-[#0f2942] bg-slate-50/80 shadow-md ring-2 ring-slate-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-serif italic font-bold text-base text-slate-900 mb-1">
              Reflective Hybrid
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Expressive philosophical serif quotes and crisp geometric navigation.
            </p>
          </button>
        </div>
      </div>

      {/* Top Banner Announcements Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Top Announcement Ticker Bar
              </h3>
              <p className="text-xs text-slate-500">
                A slim header notification bar positioned at the very top of all pages.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.appearance.topBannerEnabled}
              onChange={(e) => updateAppearance('topBannerEnabled', e.target.checked)}
              className="w-4 h-4 rounded-sm text-[#0f2942]"
            />
            <span>Enable Top Ticker</span>
          </label>
        </div>

        {config.appearance.topBannerEnabled && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Badge Label
                </label>
                <input
                  type="text"
                  value={config.appearance.topBannerBadge}
                  onChange={(e) => updateAppearance('topBannerBadge', e.target.value)}
                  placeholder="e.g. OFFICIAL PORTAL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Announcement Text
                </label>
                <input
                  type="text"
                  value={config.appearance.topBannerText}
                  onChange={(e) => updateAppearance('topBannerText', e.target.value)}
                  placeholder="e.g. Welcome to UHV Cell – NBKRIST: Explore the 9 Core Values"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* Live Ticker Preview */}
            <div className="pt-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Preview:
              </span>
              <div
                className="py-2 px-4 text-xs flex items-center justify-center gap-2 rounded-xl text-white shadow-xs"
                style={{ backgroundColor: config.appearance.primaryColor }}
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900"
                  style={{ backgroundColor: config.appearance.accentColor }}
                >
                  {config.appearance.topBannerBadge}
                </span>
                <span>{config.appearance.topBannerText}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
