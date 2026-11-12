import React, { useState } from 'react';
import { WebsiteConfig } from '../../../types';
import { Upload, Image as ImageIcon, Globe, Shield, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { UHVLogo } from '../../UHVLogo';
import { compressImageFile } from '../../../utils/imageCompressor';

interface BrandingTabProps {
  config: WebsiteConfig;
  onChange: (updated: WebsiteConfig) => void;
}

export const BrandingTab: React.FC<BrandingTabProps> = ({ config, onChange }) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(config.branding.customLogoUrl);
  const [urlInput, setUrlInput] = useState('');

  const updateBranding = (field: keyof WebsiteConfig['branding'], value: any) => {
    onChange({
      ...config,
      branding: {
        ...config.branding,
        [field]: value,
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Zero-cost client-side compression: keeps custom logo under 20KB
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 240,
        maxHeight: 240,
        quality: 0.8,
      });
      setLogoPreview(compressedDataUrl);
      updateBranding('customLogoUrl', compressedDataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoPreview(dataUrl);
        updateBranding('customLogoUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyLogoUrl = () => {
    if (!urlInput.trim()) return;
    setLogoPreview(urlInput.trim());
    updateBranding('customLogoUrl', urlInput.trim());
    setUrlInput('');
  };

  const handleClearLogo = () => {
    setLogoPreview(null);
    updateBranding('customLogoUrl', null);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Official Institutional Identity */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Institutional Branding & Official Identity
            </h2>
            <p className="text-xs text-slate-500">
              Configure the primary titles, organization credentials, and slogans that represent the UHV Cell across the portal.
            </p>
          </div>
        </div>

        {/* Logo Management Section */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-600" />
            Official UHV / NBKRIST Logo Asset
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Live Logo Preview Box */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Official UHV Logo Preview"
                    className="w-20 h-20 object-contain rounded-xl"
                  />
                ) : (
                  <UHVLogo size="xl" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {logoPreview ? 'Custom Uploaded Logo Active' : 'Default Official Emblem'}
              </span>
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-4 w-full">
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your high-resolution official logo graphic file (PNG, JPG, or SVG with transparent background). The official logo is strictly used across all digital verification cards, header bars, and print sheets.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo Graphic</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Revert to Default Official Emblem</span>
                  </button>
                )}
              </div>

              {/* Or Direct Image URL input */}
              <div className="pt-3 border-t border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Or enter external image URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#0f2942]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLogoUrl}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Website Main Title
            </label>
            <input
              type="text"
              value={config.branding.websiteTitle}
              onChange={(e) => updateBranding('websiteTitle', e.target.value)}
              placeholder="e.g. UHV CELL – NBKRIST"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-[#0f2942]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Displayed prominently in header, titles, and verification sheets.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tagline / Subheading
            </label>
            <input
              type="text"
              value={config.branding.tagline}
              onChange={(e) => updateBranding('tagline', e.target.value)}
              placeholder="e.g. Universal Human Values Cell"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Subtitle appearing directly below the cell title.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Organization / College Name
            </label>
            <input
              type="text"
              value={config.branding.institutionName}
              onChange={(e) => updateBranding('institutionName', e.target.value)}
              placeholder="e.g. N.B.K.R. Institute of Science & Technology"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Official parent college or institutional sponsor.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Institution Subtitle / Accreditations
            </label>
            <input
              type="text"
              value={config.branding.institutionSubtitle}
              onChange={(e) => updateBranding('institutionSubtitle', e.target.value)}
              placeholder="e.g. Autonomous Institution • Accredited by NAAC with ‘A’ Grade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Accreditation standards (NAAC, NBA, Autonomous status).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Header Slogan / Philosophy
            </label>
            <input
              type="text"
              value={config.branding.headerSlogan}
              onChange={(e) => updateBranding('headerSlogan', e.target.value)}
              placeholder="e.g. Existence is Co-Existence"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Core universal motto displayed in badges and footers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Default Academic Year
            </label>
            <input
              type="text"
              value={config.defaultAcademicYear}
              onChange={(e) => onChange({ ...config, defaultAcademicYear: e.target.value })}
              placeholder="e.g. 2026–27"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Applied automatically to newly enrolled members and batches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
