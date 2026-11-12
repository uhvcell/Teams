import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { AppSettings } from '../../types';
import { Settings, Upload, Save, Download, RefreshCw, CheckCircle2, ShieldAlert, Image } from 'lucide-react';
import { UHVLogo } from '../UHVLogo';

interface SettingsTabProps {
  onSettingsUpdated: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.customLogoUrl);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setSettings((prev) => ({ ...prev, customLogoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    setSaveSuccess(true);
    onSettingsUpdated();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      members: storageService.getMembers(),
      feedbacks: storageService.getFeedbacks(),
      progress: storageService.getProgressRecords(),
      settings: storageService.getSettings(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UHV_NBKRIST_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.members && Array.isArray(data.members)) {
          storageService.saveMembers(data.members);
          if (data.settings) storageService.saveSettings(data.settings);
          alert(`Successfully restored ${data.members.length} member records!`);
          onSettingsUpdated();
          window.location.reload();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset all members, feedback, and settings to original defaults?')) {
      storageService.resetToDefaults();
      onSettingsUpdated();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Settings className="w-5 h-5 text-[#0f2942]" />
          <h2 className="text-lg font-bold text-slate-900">
            Portal & Branding Settings
          </h2>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Official Logo Upload Section */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative p-2 bg-white rounded-full shadow-sm border border-slate-200 shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Official UHV Logo"
                    className="w-16 h-16 object-contain rounded-full"
                  />
                ) : (
                  <UHVLogo size="lg" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Official UHV Logo Upload
                </label>
                <p className="text-xs text-slate-600 mb-3">
                  Upload your official UHV / NBKRIST logo graphic file (PNG, JPG, or SVG). Once uploaded, it is immediately used across all badges, verification headers, and profiles without modification.
                </p>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <label className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Select & Upload Official Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setSettings((prev) => ({ ...prev, customLogoUrl: null }));
                      }}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium"
                    >
                      Clear Uploaded Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cell Header Title
              </label>
              <input
                type="text"
                value={settings.cellTitle}
                onChange={(e) => setSettings({ ...settings, cellTitle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Academic Year
              </label>
              <input
                type="text"
                value={settings.defaultAcademicYear}
                onChange={(e) => setSettings({ ...settings, defaultAcademicYear: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hero Quote
              </label>
              <input
                type="text"
                value={settings.heroQuote}
                onChange={(e) => setSettings({ ...settings, heroQuote: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Database Backup, Export & Reset */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-2">
          Data Management & Database Backup
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Export full JSON records for backup, or restore from an existing JSON backup.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
          >
            <Download className="w-4 h-4" />
            Export Complete Database (JSON)
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs">
            <Upload className="w-4 h-4" />
            Import / Restore Backup (JSON)
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-medium ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Seed Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
