import React from 'react';
import { WebsiteConfig } from '../../../types';
import { Mail, Phone, MapPin, Clock, Share2, Youtube, Linkedin, Twitter, Instagram, Facebook, Send } from 'lucide-react';

interface ContactSocialTabProps {
  config: WebsiteConfig;
  onChange: (updated: WebsiteConfig) => void;
}

export const ContactSocialTab: React.FC<ContactSocialTabProps> = ({ config, onChange }) => {
  const updateContact = (field: keyof WebsiteConfig['contact'], value: any) => {
    onChange({
      ...config,
      contact: {
        ...config.contact,
        [field]: value,
      },
    });
  };

  const updateSocial = (network: keyof WebsiteConfig['contact']['socialLinks'], url: string) => {
    onChange({
      ...config,
      contact: {
        ...config.contact,
        socialLinks: {
          ...config.contact.socialLinks,
          [network]: url,
        },
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Contact Information */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Campus Contact & Physical Office Coordinates
            </h2>
            <p className="text-xs text-slate-500">
              Public contact info displayed in footers, inquiry channels, and verified member verification footers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-700" />
              <span>Official Cell Email Address</span>
            </label>
            <input
              type="email"
              value={config.contact.email}
              onChange={(e) => updateContact('email', e.target.value)}
              placeholder="e.g. uhvcell@nbkrist.org"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              <span>Contact Telephone / Helpline</span>
            </label>
            <input
              type="text"
              value={config.contact.phone}
              onChange={(e) => updateContact('phone', e.target.value)}
              placeholder="e.g. +91 8624 228247"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Physical Campus Office Location</span>
            </label>
            <input
              type="text"
              value={config.contact.location}
              onChange={(e) => updateContact('location', e.target.value)}
              placeholder="e.g. Universal Human Values Cell, Administrative Block, NBKRIST Campus, Vidyanagar..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Working Hours & Availability</span>
            </label>
            <input
              type="text"
              value={config.contact.workingHours}
              onChange={(e) => updateContact('workingHours', e.target.value)}
              placeholder="e.g. Monday – Saturday: 9:00 AM – 5:00 PM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Social Media Channels & Outreach Links
            </h3>
            <p className="text-xs text-slate-500">
              Connect students to recorded workshop seminars, student reflections, and peer channels.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-rose-600" />
              <span>YouTube Channel</span>
            </label>
            <input
              type="url"
              value={config.contact.socialLinks.youtube || ''}
              onChange={(e) => updateSocial('youtube', e.target.value)}
              placeholder="https://youtube.com/@nbkrist_uhv"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Linkedin className="w-4 h-4 text-blue-700" />
              <span>LinkedIn Page</span>
            </label>
            <input
              type="url"
              value={config.contact.socialLinks.linkedin || ''}
              onChange={(e) => updateSocial('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/uhv-nbkrist"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Twitter className="w-4 h-4 text-sky-500" />
              <span>Twitter / X</span>
            </label>
            <input
              type="url"
              value={config.contact.socialLinks.twitter || ''}
              onChange={(e) => updateSocial('twitter', e.target.value)}
              placeholder="https://x.com/uhv_nbkrist"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram</span>
            </label>
            <input
              type="url"
              value={config.contact.socialLinks.instagram || ''}
              onChange={(e) => updateSocial('instagram', e.target.value)}
              placeholder="https://instagram.com/uhv_nbkrist"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </label>
            <input
              type="url"
              value={config.contact.socialLinks.facebook || ''}
              onChange={(e) => updateSocial('facebook', e.target.value)}
              placeholder="https://facebook.com/uhv.nbkrist"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-sky-600" />
              <span>Telegram Group</span>
            </label>
            <input
              type="url"
              value={config.contact.socialLinks.telegram || ''}
              onChange={(e) => updateSocial('telegram', e.target.value)}
              placeholder="https://t.me/uhv_nbkrist"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
