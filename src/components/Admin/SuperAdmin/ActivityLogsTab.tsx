import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../../types';
import { storageService } from '../../../services/storage';
import { History, Filter, Trash2, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export const ActivityLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(() => storageService.getActivityLogs());
  const [filter, setFilter] = useState<string>('all');

  const refresh = () => {
    setLogs(storageService.getActivityLogs());
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the audit activity log history?')) {
      storageService.clearActivityLogs();
      refresh();
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    return l.category === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Institutional Audit & Activity Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record of administrative actions, config publications, and QR token operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'config', label: 'Website Settings' },
            { id: 'members', label: 'Members' },
            { id: 'qr', label: 'QR Tokens' },
            { id: 'auth', label: 'Admin Logins' },
            { id: 'system', label: 'System' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                filter === item.id
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Logs Table / List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No audit logs recorded in this category yet.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.category === 'Branding' || log.category === 'Homepage' || log.category === 'About'
                          ? 'bg-purple-100 text-purple-800'
                          : log.category === 'Members'
                          ? 'bg-blue-100 text-blue-800'
                          : log.category === 'QR'
                          ? 'bg-amber-100 text-amber-800'
                          : log.category === 'Security'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {log.category}
                    </span>
                    <span className="font-bold text-slate-900">{log.action}</span>
                  </div>
                  {log.details && <p className="text-slate-600 font-mono text-[11px]">{log.details}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">By: {log.adminName || log.performedBy}</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
