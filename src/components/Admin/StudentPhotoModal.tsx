import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { storageService } from '../../services/storage';
import { compressImageFile } from '../../utils/imageCompressor';
import { MemberPhoto, PhotoLoadStatus } from '../MemberPhoto';
import {
  X,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Camera,
  Trash2,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface StudentPhotoModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onPhotoUpdated: (updatedMember: Member) => void;
}

export const StudentPhotoModal: React.FC<StudentPhotoModalProps> = ({
  isOpen,
  member,
  onClose,
  onPhotoUpdated,
}) => {
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<PhotoLoadStatus>('missing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (member) {
      setPendingPhotoUrl(member.photoUrl || '');
      setUrlInput(
        member.photoUrl && member.photoUrl.startsWith('http')
          ? member.photoUrl
          : ''
      );
      setErrorMessage(null);
      setSuccessToast(false);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 100% Zero-cost browser compression to ~10KB-20KB max 320x320
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.8,
        mimeType: 'image/jpeg',
      });

      // Verify that compressed image is a valid image data URL
      if (!compressedDataUrl.startsWith('data:image/')) {
        throw new Error('Invalid image format after compression');
      }

      setPendingPhotoUrl(compressedDataUrl);
    } catch (err: unknown) {
      console.error('[PhotoModal] Compression error:', err);
      setErrorMessage('Failed to process image file. Please choose a standard PNG or JPEG image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = () => {
    const clean = urlInput.trim();
    if (!clean) {
      setErrorMessage('Please enter an image URL.');
      return;
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setErrorMessage('Image URL must start with http:// or https://');
      return;
    }

    setErrorMessage(null);
    setPendingPhotoUrl(clean);
  };

  const handleRemovePhoto = () => {
    setPendingPhotoUrl('');
    setUrlInput('');
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!member) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Update in storage and Cloud Firestore
      const updated = await storageService.updateMemberPhotoAsync(
        member.qrToken,
        pendingPhotoUrl || undefined
      );

      if (updated) {
        setSuccessToast(true);
        onPhotoUpdated(updated);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        throw new Error('Member not found or failed to update.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to save photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isChanged = (pendingPhotoUrl || '') !== (member.photoUrl || '');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2942] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight">
                Update Member Photo
              </h3>
              <p className="text-[11px] text-slate-300">
                {member.name} • {member.position || member.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Success Notification */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Photo updated successfully in Firestore & Local storage!
            </div>
          )}

          {/* Current & Preview Box */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative">
              <MemberPhoto
                photoUrl={pendingPhotoUrl}
                name={member.name}
                size="lg"
                shape="rounded"
                showStatusIndicator={true}
                onStatusChange={setCurrentStatus}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Photo Status
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
                {currentStatus === 'available' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Photo Available & Verified
                  </span>
                ) : currentStatus === 'loading' ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    Testing Photo Load...
                  </span>
                ) : currentStatus === 'error' ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full text-[11px]">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Photo Failed to Load
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full text-[11px]">
                    Photo Missing / Not Set
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Internal QR token and records are preserved untouched.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode Switch: Upload vs URL */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setPhotoMode('upload')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                photoMode === 'upload'
                  ? 'bg-white text-[#0f2942] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Photo File
            </button>
            <button
              type="button"
              onClick={() => setPhotoMode('url')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                photoMode === 'url'
                  ? 'bg-white text-[#0f2942] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Image Web URL
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {photoMode === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-[#0f2942] rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/80">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  Select Member Portrait Photo
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  JPEG, PNG, or WebP. Auto-optimized to zero-cost format (~15KB).
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>

              {pendingPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Current Photo
                </button>
              )}
            </div>
          )}

          {/* Mode 2: Image Web URL */}
          {photoMode === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Public Image HTTPS URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/portrait.jpg"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3.5 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-semibold hover:bg-[#163a5e]"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {pendingPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Current Photo
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !isChanged}
              className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Photo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
