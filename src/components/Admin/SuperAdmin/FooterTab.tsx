import React, { useState } from 'react';
import { WebsiteConfig, FooterQuickLink } from '../../../types';
import { Layout, Plus, Trash2, Edit2, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface FooterTabProps {
  config: WebsiteConfig;
  onChange: (updated: WebsiteConfig) => void;
}

export const FooterTab: React.FC<FooterTabProps> = ({ config, onChange }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const updateFooter = (field: keyof WebsiteConfig['footer'], value: any) => {
    onChange({
      ...config,
      footer: {
        ...config.footer,
        [field]: value,
      },
    });
  };

  const handleAddLink = () => {
    if (!newLabel || !newUrl) return;
    const item: FooterQuickLink = {
      id: 'ql-' + Date.now().toString(36),
      label: newLabel,
      url: newUrl,
    };
    updateFooter('quickLinks', [...config.footer.quickLinks, item]);
    setNewLabel('');
    setNewUrl('');
  };

  const handleDeleteLink = (id: string) => {
    updateFooter(
      'quickLinks',
      config.footer.quickLinks.filter((l) => l.id !== id)
    );
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
          <Layout className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Footer Content & Privacy Disclaimers
          </h2>
          <p className="text-xs text-slate-500">
            Customize the bottom footer description, navigation shortcuts, copyright, and zero-ID privacy disclosure.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            About Cell Summary (Footer Column 1)
          </label>
          <textarea
            rows={3}
            value={config.footer.aboutSummary}
            onChange={(e) => updateFooter('aboutSummary', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Motto / Quote Banner Text
          </label>
          <input
            type="text"
            value={config.footer.motto}
            onChange={(e) => updateFooter('motto', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm italic font-serif focus:ring-2 focus:ring-[#0f2942]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero ID Privacy Disclaimer Notice</span>
          </label>
          <textarea
            rows={2}
            value={config.footer.disclaimer}
            onChange={(e) => updateFooter('disclaimer', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Explicitly assures students and parents that no roll numbers or government identification numbers are collected or revealed.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Copyright Line
          </label>
          <input
            type="text"
            value={config.footer.copyrightText}
            onChange={(e) => updateFooter('copyrightText', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
          />
        </div>
      </div>

      {/* Quick Links Manager */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-[#0f2942]" />
          Footer Navigation Links ({config.footer.quickLinks.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {config.footer.quickLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900">{link.label}</span>
                <span className="text-slate-400 block font-mono text-[10px]">{link.url}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteLink(link.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add link */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Link Label (e.g. Workshop Modules)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
          />
          <input
            type="text"
            placeholder="Link Target / View (e.g. values, feedback, or URL)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
          />
          <button
            type="button"
            onClick={handleAddLink}
            className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
};
