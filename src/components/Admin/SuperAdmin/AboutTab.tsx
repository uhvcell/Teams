import React, { useState } from 'react';
import { WebsiteConfig, CommitteeMember } from '../../../types';
import { BookOpen, Users, Plus, Trash2, Edit2, ShieldCheck, Heart } from 'lucide-react';
import { MemberPhoto } from '../../MemberPhoto';

interface AboutTabProps {
  config: WebsiteConfig;
  onChange: (updated: WebsiteConfig) => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({ config, onChange }) => {
  const [newObjective, setNewObjective] = useState('');
  const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
  const [leaderForm, setLeaderForm] = useState<Partial<CommitteeMember>>({
    name: '',
    role: '',
    department: '',
    photoUrl: '',
    message: '',
  });

  const updateAbout = (field: keyof WebsiteConfig['about'], value: any) => {
    onChange({
      ...config,
      about: {
        ...config.about,
        [field]: value,
      },
    });
  };

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    updateAbout('objectives', [...config.about.objectives, newObjective.trim()]);
    setNewObjective('');
  };

  const handleDeleteObjective = (index: number) => {
    updateAbout(
      'objectives',
      config.about.objectives.filter((_, i) => i !== index)
    );
  };

  const handleSaveLeader = () => {
    if (!leaderForm.name || !leaderForm.role) return;

    if (editingLeaderId) {
      const updated = config.about.leadership.map((l) =>
        l.id === editingLeaderId ? ({ ...l, ...leaderForm } as CommitteeMember) : l
      );
      updateAbout('leadership', updated);
      setEditingLeaderId(null);
    } else {
      const created: CommitteeMember = {
        id: 'lead-' + Date.now().toString(36),
        name: leaderForm.name || '',
        role: leaderForm.role || '',
        department: leaderForm.department || '',
        photoUrl: leaderForm.photoUrl || '',
        message: leaderForm.message || '',
      };
      updateAbout('leadership', [...config.about.leadership, created]);
    }

    setLeaderForm({
      name: '',
      role: '',
      department: '',
      photoUrl: '',
      message: '',
    });
  };

  const handleDeleteLeader = (id: string) => {
    updateAbout(
      'leadership',
      config.about.leadership.filter((l) => l.id !== id)
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Vision, Mission & AICTE Guidelines */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Institutional Vision, Mission & AICTE Alignment
            </h2>
            <p className="text-xs text-slate-500">
              Define the philosophical core, foundational values, and curriculum compliance with national guidelines.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vision Statement
            </label>
            <textarea
              rows={2}
              value={config.about.vision}
              onChange={(e) => updateAbout('vision', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mission Statement
            </label>
            <textarea
              rows={2}
              value={config.about.mission}
              onChange={(e) => updateAbout('mission', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              AICTE National Model Curriculum Alignment
            </label>
            <textarea
              rows={3}
              value={config.about.aicteGuidelines}
              onChange={(e) => updateAbout('aicteGuidelines', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>
        </div>

        {/* Objectives Section */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Core Objectives of UHV Cell ({config.about.objectives.length})
          </h3>

          <div className="space-y-2 mb-4">
            {config.about.objectives.map((obj, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#0f2942] shrink-0 mt-0.5">•</span>
                  <span>{obj}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteObjective(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Enter new objective..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
            <button
              type="button"
              onClick={handleAddObjective}
              className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Objective
            </button>
          </div>
        </div>
      </div>

      {/* Leadership & Advisory Committee */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0f2942]" />
              Leadership & Advisory Committee Members
            </h3>
            <p className="text-xs text-slate-500">
              Showcase cell conveners, faculty mentors, institutional leaders, and student presidents.
            </p>
          </div>
        </div>

        {/* Add/Edit Leader Form */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {editingLeaderId ? 'Edit Committee Member' : 'Add Committee / Leadership Member'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Full Name with Title
              </label>
              <input
                type="text"
                value={leaderForm.name || ''}
                onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                placeholder="e.g. Dr. M. Sreenivasa Rao"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Role / Cell Designation
              </label>
              <input
                type="text"
                value={leaderForm.role || ''}
                onChange={(e) => setLeaderForm({ ...leaderForm, role: e.target.value })}
                placeholder="e.g. Faculty Convener & UHV Coordinator"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Department / Branch
              </label>
              <input
                type="text"
                value={leaderForm.department || ''}
                onChange={(e) => setLeaderForm({ ...leaderForm, department: e.target.value })}
                placeholder="e.g. Department of Humanities & Sciences"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={leaderForm.photoUrl || ''}
                onChange={(e) => setLeaderForm({ ...leaderForm, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Reflection / Message
              </label>
              <textarea
                rows={2}
                value={leaderForm.message || ''}
                onChange={(e) => setLeaderForm({ ...leaderForm, message: e.target.value })}
                placeholder="Short inspiring thought on human values and harmony..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingLeaderId && (
              <button
                type="button"
                onClick={() => {
                  setEditingLeaderId(null);
                  setLeaderForm({
                    name: '',
                    role: '',
                    department: '',
                    photoUrl: '',
                    message: '',
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveLeader}
              className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingLeaderId ? 'Update Member' : 'Add Committee Member'}</span>
            </button>
          </div>
        </div>

        {/* Existing Committee List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.about.leadership.map((leader) => (
            <div
              key={leader.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MemberPhoto
                    photoUrl={leader.photoUrl}
                    name={leader.name}
                    size="sm"
                    shape="circle"
                    className="border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{leader.name}</h4>
                    <span className="text-[11px] font-semibold text-[#0f2942] block">
                      {leader.role}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{leader.department}</span>
                  </div>
                </div>

                {leader.message && (
                  <p className="text-xs text-slate-600 italic border-t border-slate-100 pt-2">
                    &ldquo;{leader.message}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLeaderId(leader.id);
                    setLeaderForm(leader);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLeader(leader.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-xs"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
