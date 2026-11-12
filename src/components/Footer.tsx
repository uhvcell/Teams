import React from 'react';
import { UHVLogo } from './UHVLogo';
import { storageService } from '../services/storage';
import {
  ShieldCheck,
  Heart,
  MapPin,
  Mail,
  Phone,
  Clock,
  Globe,
  Youtube,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Send,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const config = storageService.getPublishedConfig();
  const primaryColor = config.appearance.primaryColor || '#0f2942';

  const social = config.contact.socialLinks || {};

  return (
    <footer
      className="text-white border-t-4 border-amber-400 print:hidden transition-colors"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Institutional Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-full">
                <UHVLogo size="md" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">
                  {config.branding.websiteTitle}
                </h3>
                <p className="text-xs text-amber-300 font-medium">
                  {config.branding.tagline} • {config.branding.institutionName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {config.footer.aboutSummary}
            </p>

            <div className="inline-block p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-200 italic font-serif">
              “{config.footer.motto || config.branding.headerSlogan}”
            </div>

            {/* Social Links Row */}
            <div className="flex items-center gap-2 pt-2">
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600 flex items-center justify-center text-white transition-colors"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-sky-500 flex items-center justify-center text-white transition-colors"
                  title="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-pink-600 flex items-center justify-center text-white transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {social.telegram && (
                <a
                  href={social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-sky-600 flex items-center justify-center text-white transition-colors"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Digital Verification & Zero-ID Assurance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Verification Protocol
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero Student ID Exposure Rule</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Internal Random Cryptographic Token</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Camera Smartphone QR Scanning</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Values-Based Human Co-Existence</span>
              </li>
            </ul>

            {config.footer.disclaimer && (
              <p className="text-[11px] text-slate-400 border-t border-white/10 pt-2 leading-relaxed">
                {config.footer.disclaimer}
              </p>
            )}
          </div>

          {/* Col 3: Campus Coordinates */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Campus Coordinates
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{config.contact.location}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{config.contact.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{config.contact.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{config.contact.workingHours}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            {config.footer.copyrightText ||
              `© ${new Date().getFullYear()} Universal Human Values Cell – NBKRIST. All rights reserved.`}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Protected Digital Member Portal • Zero ID Verification Guarantee
          </p>
        </div>
      </div>
    </footer>
  );
};
