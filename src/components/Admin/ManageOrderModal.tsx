import React, { useState, useEffect } from 'react';
import { Member, DEFAULT_POSITIONS } from '../../types';
import { storageService } from '../../services/storage';
import { MemberPhoto } from '../MemberPhoto';
import {
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ManageOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onOrderUpdated?: () => void;
}

export const ManageOrderModal: React.FC<ManageOrderModalProps> = ({
  isOpen,
  onClose,
  members,
  onOrderUpdated,
}) => {
  // Available teams: standard hierarchy first, followed by any custom teams
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('Technical Team');
  
  // Local working list of members for the currently selected team
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [selectedMemberToken, setSelectedMemberToken] = useState<string | null>(null);
  const [targetPositionInput, setTargetPositionInput] = useState<string>('');
  
  // State for drag-and-drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Status & feedback
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize teams list
  useEffect(() => {
    if (!isOpen) return;

    const storedPositions = storageService.getPositions();
    const orderedStandard = [
      'President',
      'Vice-President',
      'Core Team',
      'Coordinator',
      'Technical Team',
      'Event Management Team',
      'Designing Team',
      'Innovation Team',
      'Volunteer',
    ];

    // Combine standard and custom positions, preserving hierarchy with Volunteer at the end
    const customPositions = storedPositions.filter(
      (pos) => !orderedStandard.some((std) => std.toLowerCase() === pos.toLowerCase())
    );

    const fullTeamList = [
      ...orderedStandard.filter((pos) => pos.toLowerCase() !== 'volunteer'),
      ...customPositions,
      'Volunteer',
    ];

    setTeams(fullTeamList);

    // Default to the first team that has active members, or Technical Team
    if (!selectedTeam) {
      setSelectedTeam(fullTeamList[0] || 'Technical Team');
    }
  }, [isOpen]);

  // Load and sort members whenever selected team or incoming members change
  useEffect(() => {
    if (!isOpen || !selectedTeam) return;

    const cleanTeam = selectedTeam.trim().toLowerCase();
    const deletedTokens = storageService.getDeletedTokens();

    const filtered = members
      .filter((m) => {
        if (deletedTokens.includes(m.qrToken)) return false;
        const pos = (m.position || m.role || 'Volunteer').trim().toLowerCase();
        return pos === cleanTeam;
      })
      .sort((a, b) => {
        const orderA = typeof a.displayOrder === 'number' && a.displayOrder > 0 ? a.displayOrder : 999999;
        const orderB = typeof b.displayOrder === 'number' && b.displayOrder > 0 ? b.displayOrder : 999999;
        return orderA - orderB;
      });

    // Normalize displayOrders if they are missing or zero
    const normalized = filtered.map((m, idx) => ({
      ...m,
      displayOrder: typeof m.displayOrder === 'number' && m.displayOrder > 0 ? m.displayOrder : idx + 1,
    }));

    setTeamMembers(normalized);
    setHasChanges(false);
    setFeedback(null);

    // Keep selected member if still in this team, else select first member
    if (normalized.length > 0) {
      if (!selectedMemberToken || !normalized.some((m) => m.qrToken === selectedMemberToken)) {
        setSelectedMemberToken(normalized[0].qrToken);
        setTargetPositionInput('1');
      } else {
        const idx = normalized.findIndex((m) => m.qrToken === selectedMemberToken);
        setTargetPositionInput(String(idx + 1));
      }
    } else {
      setSelectedMemberToken(null);
      setTargetPositionInput('');
    }
  }, [isOpen, selectedTeam, members]);

  // Sync targetPositionInput when selected member changes
  useEffect(() => {
    if (!selectedMemberToken) {
      setTargetPositionInput('');
      return;
    }
    const idx = teamMembers.findIndex((m) => m.qrToken === selectedMemberToken);
    if (idx !== -1) {
      setTargetPositionInput(String(idx + 1));
    }
  }, [selectedMemberToken, teamMembers]);

  if (!isOpen) return null;

  // Selected member object
  const selectedMember = teamMembers.find((m) => m.qrToken === selectedMemberToken) || null;
  const selectedMemberIndex = selectedMember
    ? teamMembers.findIndex((m) => m.qrToken === selectedMemberToken)
    : -1;

  // Re-indexer helper: updates displayOrder 1..N based on array indices
  const reindexList = (list: Member[]): Member[] => {
    return list.map((m, idx) => ({
      ...m,
      displayOrder: idx + 1,
    }));
  };

  // Move member to a new 0-based index
  const moveToIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= teamMembers.length) return;
    if (toIndex < 0 || toIndex >= teamMembers.length) return;

    const copy = [...teamMembers];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);

    const reindexed = reindexList(copy);
    setTeamMembers(reindexed);
    setHasChanges(true);
    setTargetPositionInput(String(toIndex + 1));
    setFeedback(null);
  };

  // Button actions
  const handleMoveUp = (mIndex: number) => {
    if (mIndex <= 0) return;
    moveToIndex(mIndex, mIndex - 1);
  };

  const handleMoveDown = (mIndex: number) => {
    if (mIndex >= teamMembers.length - 1) return;
    moveToIndex(mIndex, mIndex + 1);
  };

  const handleMoveToFirst = (mIndex: number) => {
    if (mIndex <= 0) return;
    moveToIndex(mIndex, 0);
  };

  const handleMoveToLast = (mIndex: number) => {
    if (mIndex >= teamMembers.length - 1) return;
    moveToIndex(mIndex, teamMembers.length - 1);
  };

  // Direct position jump (1-based position input)
  const handleApplyPositionJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIndex === -1) return;

    const parsed = parseInt(targetPositionInput, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > teamMembers.length) {
      setFeedback({
        type: 'error',
        message: `Please enter a valid position between 1 and ${teamMembers.length}.`,
      });
      return;
    }

    const target0Index = parsed - 1;
    if (target0Index === selectedMemberIndex) return;

    moveToIndex(selectedMemberIndex, target0Index);
    setFeedback({
      type: 'success',
      message: `Moved ${selectedMember?.name} to position #${parsed}. Remember to click "Save Order".`,
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or custom drag preview
    if (teamMembers[index]) {
      setSelectedMemberToken(teamMembers[index].qrToken);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    moveToIndex(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Save changes
  const handleSaveOrder = async () => {
    if (!selectedTeam || teamMembers.length === 0) return;
    try {
      setIsSaving(true);
      setFeedback(null);

      const orderedTokens = teamMembers.map((m) => m.qrToken);
      await storageService.reorderTeamMembers(selectedTeam, orderedTokens);

      setHasChanges(false);
      setFeedback({
        type: 'success',
        message: `Display order for "${selectedTeam}" saved successfully and synced to Cloud Firestore.`,
      });

      if (onOrderUpdated) {
        onOrderUpdated();
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Failed to save order. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Revert changes back to current stored state
  const handleReset = () => {
    const cleanTeam = selectedTeam.trim().toLowerCase();
    const storedMembers = storageService.getMembers();
    const deletedTokens = storageService.getDeletedTokens();

    const filtered = storedMembers
      .filter((m) => {
        if (deletedTokens.includes(m.qrToken)) return false;
        const pos = (m.position || m.role || 'Volunteer').trim().toLowerCase();
        return pos === cleanTeam;
      })
      .sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));

    setTeamMembers(filtered);
    setHasChanges(false);
    setFeedback(null);
  };

  // Count active members per team for tab badges
  const getTeamMemberCount = (teamName: string) => {
    const clean = teamName.trim().toLowerCase();
    const deleted = storageService.getDeletedTokens();
    return members.filter(
      (m) =>
        !deleted.includes(m.qrToken) &&
        (m.position || m.role || 'Volunteer').trim().toLowerCase() === clean
    ).length;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#0f2942] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                Manage Member Display Order
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Control the manual display sequence of members inside each team independently.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Selector Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Select Team to Reorder:
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Independent per team • Zero ID privacy compliant</span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {teams.map((teamName) => {
              const isSelected = selectedTeam.toLowerCase() === teamName.toLowerCase();
              const count = getTeamMemberCount(teamName);
              return (
                <button
                  key={teamName}
                  onClick={() => {
                    if (hasChanges) {
                      if (!window.confirm(`You have unsaved order changes in ${selectedTeam}. Discard and switch?`)) {
                        return;
                      }
                    }
                    setSelectedTeam(teamName);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-[#0f2942] text-white shadow-sm ring-2 ring-[#0f2942]/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{teamName}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-500 hover:text-slate-800 text-[11px]"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Main Body (2 Columns on Desktop: Left = Draggable Roster, Right = Selected Member Controls) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Member Roster List (7 cols) */}
          <div className="md:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>{selectedTeam} Roster ({teamMembers.length})</span>
                {hasChanges && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                    ● Unsaved
                  </span>
                )}
              </h3>
              <span className="text-[11px] text-slate-400">
                Drag ☰ or click to select
              </span>
            </div>

            {teamMembers.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                <p className="text-sm font-semibold text-slate-600">
                  No active members assigned to "{selectedTeam}".
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Add members to this team from the "Add Member" tab or update existing members to this team to reorder them here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {teamMembers.map((member, index) => {
                  const isSelected = member.qrToken === selectedMemberToken;
                  const isDragging = draggedIndex === index;
                  const isDropTarget = dragOverIndex === index;

                  return (
                    <div
                      key={member.qrToken}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => setSelectedMemberToken(member.qrToken)}
                      className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                      } ${
                        isDropTarget
                          ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-300'
                          : isSelected
                          ? 'border-[#0f2942] bg-blue-50/60 shadow-xs ring-1 ring-[#0f2942]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Position Number Badge */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          isSelected
                            ? 'bg-[#0f2942] text-amber-300 shadow-2xs'
                            : index === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Profile Photo */}
                      <MemberPhoto
                        photoUrl={member.photoUrl}
                        name={member.name}
                        size="sm"
                        shape="rounded"
                        className="border border-slate-200 shrink-0"
                      />

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {member.name}
                          </h4>
                          {index === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                              Top #1
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {member.department} • {member.year}
                        </p>
                      </div>

                      {/* Quick Move Up/Down Buttons per row */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 rounded-lg text-slate-500 hover:text-[#0f2942] hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === teamMembers.length - 1}
                          title="Move Down"
                          className="p-1 rounded-lg text-slate-500 hover:text-[#0f2942] hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Member Controls (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Selected Member Controls
              </h3>

              {selectedMember ? (
                <div className="space-y-4">
                  {/* Selected Member Preview Card */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
                    <MemberPhoto
                      photoUrl={selectedMember.photoUrl}
                      name={selectedMember.name}
                      size="md"
                      shape="rounded"
                      className="border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {selectedMember.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {selectedMember.department}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#0f2942] text-amber-300 font-mono text-[10px] font-bold">
                          Current Position: #{selectedMemberIndex + 1}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          of {teamMembers.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step Buttons: Move to First / Move Up / Move Down / Move to Last */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-2">
                      Directional Controls:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleMoveToFirst(selectedMemberIndex)}
                        disabled={selectedMemberIndex <= 0}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ChevronsUp className="w-4 h-4 text-amber-600" />
                        Move to First
                      </button>

                      <button
                        onClick={() => handleMoveToLast(selectedMemberIndex)}
                        disabled={selectedMemberIndex >= teamMembers.length - 1}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ChevronsDown className="w-4 h-4 text-amber-600" />
                        Move to Last
                      </button>

                      <button
                        onClick={() => handleMoveUp(selectedMemberIndex)}
                        disabled={selectedMemberIndex <= 0}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ArrowUp className="w-4 h-4 text-blue-600" />
                        Move Up
                      </button>

                      <button
                        onClick={() => handleMoveDown(selectedMemberIndex)}
                        disabled={selectedMemberIndex >= teamMembers.length - 1}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-800 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ArrowDown className="w-4 h-4 text-blue-600" />
                        Move Down
                      </button>
                    </div>
                  </div>

                  {/* Direct Jump to Position [number] [Apply] */}
                  <form onSubmit={handleApplyPositionJump} className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Move Directly to Position:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1}
                          max={teamMembers.length}
                          value={targetPositionInput}
                          onChange={(e) => setTargetPositionInput(e.target.value)}
                          placeholder="Position #"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0f2942] focus:border-[#0f2942]"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">
                          1..{teamMembers.length}
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={
                          !targetPositionInput ||
                          parseInt(targetPositionInput, 10) === selectedMemberIndex + 1 ||
                          parseInt(targetPositionInput, 10) < 1 ||
                          parseInt(targetPositionInput, 10) > teamMembers.length
                        }
                        className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] disabled:opacity-40 disabled:hover:bg-[#0f2942] text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Example: Enter <strong>2</strong> and click <strong>Apply</strong>. Member shifts to position #2, and intermediate members shift automatically.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                  Click on any member in the left roster to access reordering controls.
                </div>
              )}
            </div>

            {/* Ordering Guarantee Note */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Team Isolation Rule
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                Changes in <strong>{selectedTeam}</strong> do not affect other teams (e.g. Core Team, Designing Team, or Innovation Team). Public website displays members strictly by ascending order (1, 2, 3...).
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Revert Changes
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSaving || !hasChanges || teamMembers.length === 0}
              className="px-5 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] disabled:opacity-40 disabled:hover:bg-[#0f2942] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Order...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  Save Order for {selectedTeam}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
