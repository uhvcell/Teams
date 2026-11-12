import React, { useState } from 'react';
import { storageService } from '../../../services/storage';
import { Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Database } from 'lucide-react';

export const BackupExportTab: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleExportAll = () => {
    const backupData = storageService.exportAllData();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uhv_nbkrist_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setStatusMessage({
      text: 'Full institutional backup JSON successfully generated and downloaded.',
      type: 'success',
    });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }

        const success = storageService.importAllData(parsed);
        if (success) {
          setStatusMessage({
            text: 'System database & configuration restored successfully! Reloading portal...',
            type: 'success',
          });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          throw new Error('Could not import backup data structure');
        }
      } catch (err: any) {
        setStatusMessage({
          text: 'Restore failed: ' + (err.message || 'Invalid backup file structure'),
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'WARNING: This will reset all website configuration, branding, and theme parameters back to official NBKRIST default settings. Continue?'
      )
    ) {
      storageService.resetToDefaults();
      setStatusMessage({
        text: 'Website configuration has been reset to official defaults. Reloading...',
        type: 'success',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-slate-100 text-[#0f2942]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              System Backup, Data Portability & Disaster Recovery
            </h2>
            <p className="text-xs text-slate-500">
              Generate full JSON snapshots of student records, website customizations, and audit trails.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Box */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Full System JSON Export</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Download all member records (zero-ID compliant), draft & published site settings, audit activity logs, and administrative accounts into a standalone backup file.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportAll}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Restore System from Backup</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Upload a verified UHV system backup file to restore configuration, members, and audit logs. Existing data will be safely updated.
              </p>
            </div>

            <label className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Select Backup File (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-slate-200">
          <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Reset Website Settings to Factory Defaults
              </h4>
              <p className="text-xs text-rose-700 mt-1">
                Revert all website branding, copy, and layout configurations back to original NBKRIST UHV Cell defaults. Student records will remain intact.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs"
            >
              Reset Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
