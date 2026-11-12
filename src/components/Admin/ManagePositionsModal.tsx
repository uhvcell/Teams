import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Member, DEFAULT_POSITIONS } from '../../types';
import { X, Plus, Trash2, Users, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface ManagePositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onPositionsChanged?: () => void;
}

export const ManagePositionsModal: React.FC<ManagePositionsModalProps> = ({
  isOpen,
  onClose,
  members,
  onPositionsChanged,
}) => {
  const [positions, setPositions] = useState<string[]>(() => storageService.getPositions());
  const [newPositionName, setNewPositionName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const clean = newPositionName.trim();
    if (!clean) return;

    const success = storageService.addPosition(clean);
    if (!success) {
      setErrorMsg(`Position "${clean}" already exists.`);
      return;
    }

    setPositions(storageService.getPositions());
    setNewPositionName('');
    setSuccessMsg(`Position / Team "${clean}" successfully added.`);
    if (onPositionsChanged) onPositionsChanged();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDelete = (name: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Check if any member has this position
    const membersWithPosition = members.filter(
      (m) => (m.position || m.role || '').toLowerCase() === name.toLowerCase()
    );

    if (membersWithPosition.length > 0) {
      if (
        !window.confirm(
          `There are currently ${membersWithPosition.length} member(s) assigned to "${name}". Are you sure you want to remove this position from the list?`
        )
      ) {
        return;
      }
    }

    const removed = storageService.deletePosition(name);
    if (removed) {
      setPositions(storageService.getPositions());
      setSuccessMsg(`Position "${name}" removed.`);
      if (onPositionsChanged) onPositionsChanged();
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg('Default positions cannot be deleted.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f2942] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base sm:text-lg">
              Manage Positions & Teams
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <p className="text-xs text-slate-600">
            Configure student positions and teams. Members are automatically organized into sections under these teams on the public website.
          </p>

          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add New Position Form */}
          <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Add New Position / Team
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="e.g. Media Team, Editorial Team"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
              />
              <button
                type="submit"
                disabled={!newPositionName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold disabled:opacity-50 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Add Team
              </button>
            </div>
          </form>

          {/* List of Positions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>Position / Team Name</span>
              <span>Enrolled Members</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {positions.map((pos) => {
                const count = members.filter(
                  (m) => (m.position || m.role || '').toLowerCase() === pos.toLowerCase()
                ).length;
                const isDefault = DEFAULT_POSITIONS.some(
                  (d) => d.toLowerCase() === pos.toLowerCase()
                );

                return (
                  <div
                    key={pos}
                    className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900">
                        {pos}
                      </span>
                      {isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Standard
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0f2942] border border-blue-100">
                        {count} {count === 1 ? 'member' : 'members'}
                      </span>

                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDelete(pos)}
                          title={`Delete custom position "${pos}"`}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0f2942] text-white text-xs font-bold hover:bg-[#163a5e]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
