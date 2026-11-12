import React, { useState } from 'react';
import { Member, MEMBER_ROLES } from '../../types';
import {
  createBulkQRZip,
  downloadMemberQRCard,
  downloadMemberQROnly,
  triggerFileDownload,
} from '../../services/qrService';
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

interface QRManagementProps {
  members: Member[];
  onPreviewMemberQR: (member: Member) => void;
  onRegenerateToken: (oldToken: string) => void;
}

export const QRManagement: React.FC<QRManagementProps> = ({
  members,
  onPreviewMemberQR,
  onRegenerateToken,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    current: number;
    total: number;
    statusText: string;
  } | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showBatchPrintSheet, setShowBatchPrintSheet] = useState(false);

  const [downloadingToken, setDownloadingToken] = useState<string | null>(null);
  const [globalNotice, setGlobalNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const activeMembers = members.filter((m) => m.status === 'Active');
  const filteredMembers = activeMembers.filter((m) => {
    if (selectedRoleFilter === 'all') return true;
    const pos = (m.position || m.role || '').toLowerCase();
    return pos === selectedRoleFilter.toLowerCase();
  });

  const showNotice = (type: 'success' | 'error', message: string) => {
    setGlobalNotice({ type, message });
    setTimeout(() => {
      setGlobalNotice((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleDownloadAllZip = async () => {
    if (activeMembers.length === 0 || isZipping) return;
    setIsZipping(true);
    setGlobalNotice(null);

    try {
      const zipBlob = await createBulkQRZip(
        activeMembers,
        (current, total, statusText) => {
          setZipProgress({ current, total, statusText });
        }
      );

      const dateStr = new Date().toISOString().slice(0, 10);
      triggerFileDownload(
        zipBlob,
        `UHV_NBKRIST_Active_Members_QR_Export_${dateStr}.zip`
      );
      showNotice(
        'success',
        `Bulk export complete! Downloaded archive with QR codes and printable cards for ${activeMembers.length} members.`
      );
    } catch (err: unknown) {
      console.error('ZIP generation failed:', err);
      const msg = err instanceof Error ? err.message : 'Could not package bulk ZIP archive.';
      showNotice('error', msg);
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  const handleQuickDownloadCard = async (member: Member) => {
    if (downloadingToken) return;
    try {
      setDownloadingToken(member.qrToken);
      setGlobalNotice(null);
      await downloadMemberQRCard(member);
      showNotice('success', `Official QR Card for ${member.name} downloaded successfully!`);
    } catch (err: unknown) {
      console.error('Quick download failed:', err);
      const msg = err instanceof Error ? err.message : 'Download failed';
      showNotice('error', msg);
    } finally {
      setDownloadingToken(null);
    }
  };

  const handleQuickDownloadSVG = async (member: Member) => {
    if (downloadingToken) return;
    try {
      setDownloadingToken(member.qrToken);
      setGlobalNotice(null);
      await downloadMemberQROnly(member, 'svg');
      showNotice('success', `Vector SVG QR Code for ${member.name} downloaded!`);
    } catch (err: unknown) {
      console.error('Quick SVG download failed:', err);
      const msg = err instanceof Error ? err.message : 'SVG download failed';
      showNotice('error', msg);
    } finally {
      setDownloadingToken(null);
    }
  };

  const handlePrintAllCards = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Global Status Banner */}
      {globalNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium shadow-xs transition-all ${
            globalNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {globalNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{globalNotice.message}</span>
          </div>
          <button
            onClick={() => setGlobalNotice(null)}
            className="text-slate-400 hover:text-slate-700 px-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: Bulk QR Operations */}
      <div className="bg-gradient-to-r from-[#0f2942] to-[#1e4c79] text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Bulk QR Code Distribution
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Official QR Credential Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl leading-relaxed">
            Generate, preview, print, or download cryptographic QR access codes for all active UHV Cell members. Zero Student IDs or Roll Numbers are exposed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping || activeMembers.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isZipping ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                <span>
                  {zipProgress
                    ? `${zipProgress.statusText}`
                    : 'Packaging ZIP Archive...'}
                </span>
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" />
                Download All QR Codes (ZIP)
              </>
            )}
          </button>

          <button
            onClick={() => setShowBatchPrintSheet(!showBatchPrintSheet)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {showBatchPrintSheet ? 'Hide Print Sheet' : 'Batch Print Cards'}
          </button>
        </div>
      </div>

      {/* Printable Sheet View when toggled */}
      {showBatchPrintSheet && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Printable Member Cards Grid ({filteredMembers.length} active)
              </h3>
              <p className="text-xs text-slate-500">
                Ready for printing on standard badge sheets or laminations.
              </p>
            </div>
            <button
              onClick={handlePrintAllCards}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2942] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Send to Printer Now
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.qrToken}
                className="p-4 rounded-xl border-2 border-slate-300 text-center bg-white shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold text-[#0f2942] uppercase tracking-wider">
                    UHV CELL – NBKRIST
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{member.name}</h4>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#0f2942] mt-0.5">
                    {member.position || member.role}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{member.department}</p>
                </div>

                <div className="my-3 flex justify-center">
                  <button
                    onClick={() => onPreviewMemberQR(member)}
                    className="p-1 rounded-lg border border-slate-200 hover:border-[#0f2942] transition-colors cursor-pointer"
                    title="Click to preview QR"
                  >
                    <QrCode className="w-24 h-24 text-[#0f2942]" />
                  </button>
                </div>

                <div className="text-[10px] font-bold text-[#0f2942]">
                  SCAN TO VERIFY MEMBER
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member QR Management Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#0f2942]" />
            <h3 className="font-bold text-base text-slate-900">
              Active Member QR Directory ({filteredMembers.length})
            </h3>
          </div>

          {/* Filter by Role */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Role:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Roles</option>
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isThisDownloading = downloadingToken === member.qrToken;
            return (
              <div
                key={member.qrToken}
                className="p-4 rounded-xl border border-slate-200 hover:border-[#0f2942] transition-all bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#0f2942]">
                      {member.position || member.role}
                    </span>
                    <StatusBadge status={member.status} size="sm" />
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{member.name}</h4>
                  <p className="text-xs text-slate-500">{member.department}</p>
                  <p className="text-[11px] text-slate-400">
                    {member.year} • Sec {member.section}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onPreviewMemberQR(member)}
                    disabled={isThisDownloading}
                    className="flex-1 py-1.5 rounded-lg bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                    Preview & Export
                  </button>

                  {/* Quick Card Download PNG */}
                  <button
                    onClick={() => handleQuickDownloadCard(member)}
                    disabled={isThisDownloading}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Download Official Card (PNG)"
                    aria-label={`Download Card for ${member.name}`}
                  >
                    {isThisDownloading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0f2942]" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>

                  {/* Quick SVG Download */}
                  <button
                    onClick={() => handleQuickDownloadSVG(member)}
                    disabled={isThisDownloading}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Download Scalable Vector (SVG)"
                    aria-label={`Download Vector SVG for ${member.name}`}
                  >
                    <FileCode className="w-4 h-4 text-blue-600" />
                  </button>

                  {/* Regenerate Token */}
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Regenerate token for ${member.name}? Previous QR cards will stop working.`
                        )
                      ) {
                        onRegenerateToken(member.qrToken);
                      }
                    }}
                    disabled={isThisDownloading}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Regenerate Token"
                    aria-label={`Regenerate Token for ${member.name}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
