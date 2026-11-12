import React, { useEffect, useState } from 'react';
import { Member } from '../../types';
import {
  generateQRDataURL,
  downloadMemberQRCard,
  downloadMemberQROnly,
  renderMemberQRCardToCanvas,
} from '../../services/qrService';
import {
  X,
  Printer,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { UHVLogo } from '../UHVLogo';

interface QRPreviewModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onRegenerateToken: (oldToken: string) => void;
  onViewProfile: (token: string) => void;
}

export const QRPreviewModal: React.FC<QRPreviewModalProps> = ({
  member,
  isOpen,
  onClose,
  onRegenerateToken,
  onViewProfile,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const [downloadingType, setDownloadingType] = useState<'card' | 'qr_png' | 'qr_svg' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (member && isOpen) {
      setIsGenerating(true);
      setDownloadError(null);
      setSuccessMessage(null);
      generateQRDataURL(member.qrToken, 320)
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error('Failed to generate preview QR:', err);
          setDownloadError('Could not generate QR preview code.');
        })
        .finally(() => setIsGenerating(false));
    }
  }, [member, member?.qrToken, isOpen]);

  if (!isOpen || !member) return null;

  const showSuccessFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleDownloadCard = async () => {
    if (downloadingType) return;
    try {
      setDownloadingType('card');
      setDownloadError(null);
      setSuccessMessage(null);
      await downloadMemberQRCard(member, qrDataUrl);
      showSuccessFeedback('Official QR Card downloaded successfully!');
    } catch (err: unknown) {
      console.error('QR Card download error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download card';
      setDownloadError(msg);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadQRPNG = async () => {
    if (downloadingType) return;
    try {
      setDownloadingType('qr_png');
      setDownloadError(null);
      setSuccessMessage(null);
      await downloadMemberQROnly(member, 'png');
      showSuccessFeedback('Standard QR Code (PNG) downloaded successfully!');
    } catch (err: unknown) {
      console.error('QR PNG download error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download QR PNG';
      setDownloadError(msg);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadQRSVG = async () => {
    if (downloadingType) return;
    try {
      setDownloadingType('qr_svg');
      setDownloadError(null);
      setSuccessMessage(null);
      await downloadMemberQROnly(member, 'svg');
      showSuccessFeedback('Scalable Vector QR Code (SVG) downloaded successfully!');
    } catch (err: unknown) {
      console.error('QR SVG download error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download QR SVG';
      setDownloadError(msg);
    } finally {
      setDownloadingType(null);
    }
  };

  const handlePrint = async () => {
    try {
      const canvas = await renderMemberQRCardToCanvas(member, qrDataUrl);
      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print QR Card - ${member.name}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
                img { max-width: 480px; width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 12px; }
                @media print {
                  body { background: white; margin: 0; }
                  img { box-shadow: none; border-radius: 0; max-width: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } catch (err) {
      console.error('Print preview failed:', err);
      window.print();
    }
  };

  const isBusy = downloadingType !== null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2942] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base sm:text-lg">
              Official QR Card Preview & Export
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 text-center max-h-[82vh] overflow-y-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-left text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Banner with Retry */}
          {downloadError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-left text-xs text-rose-900 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{downloadError}</span>
              </div>
              <button
                onClick={handleDownloadCard}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Visual QR Card Representation */}
          <div className="max-w-[340px] mx-auto bg-white border-4 border-[#0f2942] rounded-2xl p-5 shadow-lg relative">
            <div className="p-1 rounded-full bg-slate-50 inline-block mb-1">
              <UHVLogo size="md" />
            </div>

            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              NBKR Institute of Science & Technology
            </div>
            <div className="font-serif font-bold text-base text-[#0f2942] leading-tight">
              UHV CELL – NBKRIST
            </div>
            <div className="text-[11px] font-medium text-slate-600 mb-3">
              Universal Human Values Cell
            </div>

            {/* Member Info */}
            <div className="py-2 border-t border-b border-slate-100 mb-3">
              <h4 className="font-bold text-lg text-slate-900">{member.name}</h4>
              <span className="inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0f2942] text-amber-300">
                {member.position || member.role}
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                {member.department}
              </p>
              <p className="text-[10px] text-slate-500">
                {member.year} • Section {member.section} • {member.academicYear}
              </p>
            </div>

            {/* QR Code */}
            <div className="my-3 flex justify-center">
              {isGenerating || !qrDataUrl ? (
                <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center gap-2 rounded-xl text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#0f2942]" />
                  <span className="text-[11px] font-medium">Generating QR...</span>
                </div>
              ) : (
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  <img
                    src={qrDataUrl}
                    alt="Member QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-[#0f2942] tracking-wide">
              SCAN TO VERIFY MEMBER
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              ✓ OFFICIAL DIGITAL VERIFICATION SYSTEM
            </div>
          </div>

          {/* Regeneration Warning Box */}
          {showRegenConfirm ? (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-left text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Confirm QR Token Regeneration
              </div>
              <p className="mb-3">
                Generating a new token will <strong>immediately deactivate</strong> any previously printed or downloaded QR cards for this member. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onRegenerateToken(member.qrToken);
                    setShowRegenConfirm(false);
                  }}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md font-semibold hover:bg-amber-700"
                >
                  Yes, Regenerate Now
                </button>
                <button
                  onClick={() => setShowRegenConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-slate-700 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {/* Primary Download Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Download Official Card (PNG) */}
                <button
                  onClick={handleDownloadCard}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  title="Download complete printable card with photo, badges, and QR"
                >
                  {downloadingType === 'card' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      Preparing Card PNG...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-amber-300" />
                      Download Card (PNG)
                    </>
                  )}
                </button>

                {/* Download QR Only (PNG) */}
                <button
                  onClick={handleDownloadQRPNG}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                  title="Download standalone high-resolution QR image (PNG)"
                >
                  {downloadingType === 'qr_png' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      Preparing PNG...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      QR Only (PNG)
                    </>
                  )}
                </button>

                {/* Download Scalable Vector (SVG) */}
                <button
                  onClick={handleDownloadQRSVG}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                  title="Download infinitely scalable vector QR code (SVG)"
                >
                  {downloadingType === 'qr_svg' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      Generating SVG...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      Vector (SVG)
                    </>
                  )}
                </button>
              </div>

              {/* Secondary Utility Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={handlePrint}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors disabled:opacity-60"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Card
                </button>

                <button
                  onClick={() => setShowRegenConfirm(true)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-medium transition-colors disabled:opacity-60"
                  title="Invalidates previous QR code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Token
                </button>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> High-Resolution Export
            </span>
            <button
              onClick={() => {
                onViewProfile(member.qrToken);
                onClose();
              }}
              className="font-semibold text-[#0f2942] hover:underline inline-flex items-center gap-1"
            >
              Open Digital Profile <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
