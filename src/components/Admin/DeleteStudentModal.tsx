import React, { useState } from 'react';
import { Member } from '../../types';
import { storageService } from '../../services/storage';
import { getCurrentAdminInfo } from '../../services/authPermissions';
import { AlertTriangle, Trash2, CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';

interface DeleteStudentModalProps {
  student: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedStudent: Member) => void;
}

export const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const adminInfo = getCurrentAdminInfo();

  const handleConfirmDelete = async () => {
    // Prevent accidental double clicks
    if (isDeleting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Admin authorization check
    if (!adminInfo.canDelete) {
      setErrorMessage(
        `Unable to delete student. Access denied: Your role (${adminInfo.role}) does not have permission to delete student records. Only Super Admin and Admin roles can perform deletions.`
      );
      return;
    }

    setIsDeleting(true);

    try {
      // Perform deletion in Cloud Firestore and local storage
      await storageService.deleteMemberAsync(
        student,
        adminInfo.name,
        adminInfo.email
      );

      // Show success state
      setSuccessMessage('Student deleted successfully.');

      // Notify parent component immediately to update list and counts without reloading
      setTimeout(() => {
        onSuccess(student);
        setIsDeleting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      // Log error details to browser console for debugging
      console.error('[Student Deletion Error] Failed to delete student:', err);

      setIsDeleting(false);
      // Requirement 8: Show exact clear message
      setErrorMessage('Unable to delete student. Please try again.');
    }
  };

  return (
    <div
      id="delete-student-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        id="delete-student-modal-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="delete-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
            >
              Are you sure you want to delete this student?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              This action permanently deletes the student record from Cloud Firestore.
            </p>
          </div>
        </div>

        {/* Student Details Card */}
        <div className="p-6 space-y-4">
          {/* Permission warning banner if viewer or editor */}
          {!adminInfo.canDelete && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Restricted Admin Role</p>
                <p className="text-[11px] mt-0.5">
                  Your current account role is <span className="font-semibold">{adminInfo.role}</span>. Student deletion is restricted to Super Admin and Admin roles.
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              id="delete-success-banner"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-semibold animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              id="delete-error-banner"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{errorMessage}</span>
                <span className="text-[11px] text-rose-600/80 block">
                  Check network connection and admin authentication credentials.
                </span>
              </div>
            </div>
          )}

          {/* Student Profile Specs */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 divide-y divide-slate-100 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2">
              <span className="text-slate-500 font-medium">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">{student.name}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-800">{student.department}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium">Year</span>
              <span className="font-semibold text-slate-800">
                {student.year}
                {student.section ? ` • Section ${student.section}` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 font-medium">Role</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#0f2942]/10 text-[#0f2942]">
                {student.role}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            Note: In accordance with student privacy guidelines, the student’s digital QR verification profile will be permanently invalidated. No roll numbers or government IDs are affected.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/75 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            id="cancel-delete-student-btn"
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            id="confirm-delete-student-btn"
            type="button"
            disabled={isDeleting || !adminInfo.canDelete}
            onClick={handleConfirmDelete}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Student</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
