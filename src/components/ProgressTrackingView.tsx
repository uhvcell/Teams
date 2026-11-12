import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { ValueProgressRecord } from '../types';
import { Award, CheckCircle2, TrendingUp, Users, BookOpen, Layers } from 'lucide-react';

export const ProgressTrackingView: React.FC = () => {
  const [records] = useState<ValueProgressRecord[]>(() => storageService.getProgressRecords());

  const totalParticipants = records.reduce((acc, r) => acc + r.participantsCount, 0);
  const avgCompletion = Math.round(
    records.reduce((acc, r) => acc + r.completionRate, 0) / (records.length || 1)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
          Institutional Milestone Roadmap
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
          UHV Progress & Values Assimilation Tracking
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Tracking the execution of Universal Human Values curriculum, induction workshops, and community outreach across NBKRIST departments.
        </p>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f2942] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Students Impacted
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalParticipants.toLocaleString()}+
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Across all B.Tech branches
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Completion
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {avgCompletion}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Curriculum progression
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Value Modules
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {records.length} Modules
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Self, Family, Society, Nature
            </span>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#0f2942]" />
          Key Curriculum & Activity Phases
        </h2>

        <div className="space-y-6">
          {records.map((record) => (
            <div key={record.id} className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {record.moduleName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: {record.targetGroup} • {record.participantsCount} participants
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      record.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : record.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {record.status}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {record.completionRate}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    record.completionRate === 100
                      ? 'bg-emerald-500'
                      : 'bg-[#0f2942]'
                  }`}
                  style={{ width: `${record.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
