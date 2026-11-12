import React, { useState } from 'react';
import { Member, MemberFormData, MemberStatus } from '../../types';
import { storageService } from '../../services/storage';
import { UserPlus, Save, ArrowLeft, RefreshCw, AlertCircle, Camera, Check, Plus, X, Loader2, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { MemberPhoto, PhotoLoadStatus } from '../MemberPhoto';

interface StudentFormProps {
  initialData?: Member | null;
  onSave: (data: MemberFormData, shouldRegenerateToken?: boolean) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const DEPARTMENTS = [
  'Electrical and Electronics Engineering',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence and Data Science',
  'Information Technology',
];

const YEARS = ['I B.Tech', 'II B.Tech', 'III B.Tech', 'IV B.Tech', 'M.Tech', 'MCA'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const StudentForm: React.FC<StudentFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [positionsList, setPositionsList] = useState<string[]>(() => storageService.getPositions());
  const [isAddingCustomPosition, setIsAddingCustomPosition] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');

  const initialPosition = initialData?.position || initialData?.role || 'Technical Team';

  const [formData, setFormData] = useState<MemberFormData>({
    name: initialData?.name || '',
    department: initialData?.department || DEPARTMENTS[0],
    year: initialData?.year || 'III B.Tech',
    section: initialData?.section || 'A',
    role: initialPosition,
    position: initialPosition,
    academicYear: initialData?.academicYear || '2026–27',
    joiningDate: initialData?.joiningDate || new Date().toLocaleDateString('en-GB'),
    status: initialData?.status || 'Active',
    photoUrl: initialData?.photoUrl || '',
    email: initialData?.email || '',
    bloodGroup: initialData?.bloodGroup || '',
    displayOrder: initialData?.displayOrder,
  });

  const [regenToken, setRegenToken] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photoUrl || '');
  const [photoTouched, setPhotoTouched] = useState<boolean>(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [photoLoadStatus, setPhotoLoadStatus] = useState<PhotoLoadStatus>(
    initialData?.photoUrl ? 'available' : 'missing'
  );
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleCreateCustomPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPositionName.trim();
    if (!clean) return;
    storageService.addPosition(clean);
    const updated = storageService.getPositions();
    setPositionsList(updated);
    setFormData((prev) => ({ ...prev, position: clean, role: clean }));
    setNewPositionName('');
    setIsAddingCustomPosition(false);
  };

  const handlePositionChange = (val: string) => {
    if (val === '__add_new__') {
      setIsAddingCustomPosition(true);
      return;
    }
    setFormData((prev) => ({ ...prev, position: val, role: val }));
  };

  const leadershipPositions = positionsList.filter((p) =>
    /^(president|vice[-\s]?president)$/i.test(p.trim())
  );
  const teamPositions = positionsList.filter(
    (p) =>
      /^(technical\s+team|event\s+management\s+team|designing\s+team|innovation\s+team|core\s+team|coordinator)$/i.test(
        p.trim()
      )
  );
  const generalPositions = positionsList.filter(
    (p) =>
      !leadershipPositions.includes(p) && !teamPositions.includes(p)
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setIsCompressingPhoto(true);

    try {
      // 100% zero-cost client-side compression: keeps photos tiny (< 25KB)
      // to avoid needing any paid image storage or Firebase Blaze billing.
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.8,
        mimeType: 'image/jpeg',
      });

      if (!compressedDataUrl.startsWith('data:image/')) {
        throw new Error('Invalid image file format.');
      }

      setPhotoPreview(compressedDataUrl);
      setFormData((prev) => ({ ...prev, photoUrl: compressedDataUrl }));
      setPhotoTouched(true);
    } catch (err: unknown) {
      console.error('[StudentForm] Photo compression failed:', err);
      setPhotoError('Failed to process image. Please try a different JPEG or PNG photo.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleApplyCustomUrl = () => {
    const clean = customUrl.trim();
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:image/')) {
      setPhotoError('Image URL must start with https:// or http://');
      return;
    }
    setPhotoError(null);
    setPhotoPreview(clean);
    setFormData((prev) => ({ ...prev, photoUrl: clean }));
    setPhotoTouched(true);
    setShowUrlInput(false);
    setCustomUrl('');
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setFormData((prev) => ({ ...prev, photoUrl: '' }));
    setPhotoTouched(true);
    setPhotoError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.name.trim()) {
      alert('Student Name is required.');
      return;
    }

    // Verify photo processing has finished
    if (isCompressingPhoto) {
      alert('Please wait for photo optimization to finish before saving.');
      return;
    }

    setIsSubmitting(true);

    // Critical: If editing and user never changed or removed the photo, preserve existing photoUrl!
    let finalPhotoUrl = formData.photoUrl;
    if (isEditing && !photoTouched) {
      finalPhotoUrl = initialData?.photoUrl || undefined;
    } else if (finalPhotoUrl && !finalPhotoUrl.trim()) {
      finalPhotoUrl = undefined;
    }

    const studentName = formData.name.trim();
    const payload: MemberFormData = {
      ...formData,
      name: studentName,
      studentName,
      photoUrl: finalPhotoUrl,
    };

    try {
      onSave(payload, regenToken);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900">
            {isEditing ? 'Edit UHV Cell Member Profile' : 'Add New UHV Cell Member'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isEditing
              ? 'Update member information. Token & QR code remain consistent unless explicitly regenerated.'
              : 'Add a verified student or coordinator. A secure internal random QR token is generated automatically.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload & Preview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="relative shrink-0">
            <MemberPhoto
              photoUrl={photoPreview}
              name={formData.name || 'Member'}
              size="lg"
              shape="rounded"
              showStatusIndicator={true}
              onStatusChange={setPhotoLoadStatus}
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Member Profile Photo
              </label>

              {/* Status Badge */}
              {isCompressingPhoto ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  Optimizing photo...
                </span>
              ) : photoLoadStatus === 'available' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Photo Available
                </span>
              ) : photoLoadStatus === 'error' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  Photo Failed to Load
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200/90 px-2 py-0.5 rounded-full">
                  No Photo Uploaded
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-2">
              {isEditing && !photoTouched
                ? 'Existing member photo will remain safely preserved unless you choose a new one.'
                : 'Upload a clear portrait. Automatically optimized to zero-cost fast storage.'}
            </p>

            {photoError && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* File Upload Button */}
              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Upload Photo File
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={handlePhotoUpload}
                  disabled={isCompressingPhoto}
                  className="hidden"
                />
              </label>

              {/* URL Input Toggle */}
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                Image Web URL
              </button>

              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            {/* URL Input Form */}
            {showUrlInput && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/portrait.jpg"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#0f2942]"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 bg-[#0f2942] text-white text-xs font-semibold rounded-lg hover:bg-[#163a5e]"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Student Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter student full name"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          {/* Position / Team */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Position / Team *
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustomPosition(!isAddingCustomPosition)}
                className="text-[11px] font-bold text-[#0f2942] hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3 text-amber-600" />
                {isAddingCustomPosition ? 'Cancel' : '+ Add Team'}
              </button>
            </div>

            <select
              value={formData.position || formData.role}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white font-medium"
            >
              <optgroup label="LEADERSHIP">
                {leadershipPositions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>

              <optgroup label="TEAMS">
                {teamPositions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>

              {generalPositions.length > 0 && (
                <optgroup label="GENERAL & CUSTOM TEAMS">
                  {generalPositions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </optgroup>
              )}

              <option value="__add_new__" className="font-bold text-blue-700">
                + Add New Position / Team...
              </option>
            </select>

            {/* Inline Custom Position Addition */}
            {isAddingCustomPosition && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 animate-in fade-in space-y-2">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Add New Position or Team:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newPositionName}
                    onChange={(e) => setNewPositionName(e.target.value)}
                    placeholder="e.g. Media Team, Research Team"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f2942]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomPosition}
                    disabled={!newPositionName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#0f2942] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#163a5e]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomPosition(false);
                      setNewPositionName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Department */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Department / Branch *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Year of Study *
            </label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Section *
            </label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Academic Year *
            </label>
            <input
              type="text"
              required
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              placeholder="2026–27"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Joining Date *
            </label>
            <input
              type="text"
              required
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              placeholder="DD/MM/YYYY"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Membership Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white font-semibold"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@nbkrist.org"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          {/* Blood Group (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Blood Group (Optional)
            </label>
            <select
              value={formData.bloodGroup || ''}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] bg-white"
            >
              <option value="">Select (Optional)</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* If editing: optional token regeneration checkbox */}
        {isEditing && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={regenToken}
                onChange={(e) => setRegenToken(e.target.checked)}
                className="mt-1 h-4 w-4 rounded-sm border-amber-300 text-[#0f2942] focus:ring-[#0f2942]"
              />
              <div className="text-xs text-amber-900">
                <span className="font-bold flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Secure QR Token upon saving
                </span>
                <span>
                  Check this if the student has reported a lost card or if you want to revoke previous QR printouts immediately.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Identifier Rule Compliance Confirmation */}
        <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center gap-2 text-slate-600 text-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Zero ID Identifier Rule Enforced:</strong> No Roll Number or UHV ID is required or stored. A random cryptographic internal token is linked to this profile.
          </span>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCompressingPhoto}
            className="px-6 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                Saving to Database...
              </>
            ) : (
              <>
                {isEditing ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isEditing ? 'Save Profile Changes' : 'Create Student & Generate QR'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
