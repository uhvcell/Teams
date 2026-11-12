import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [csvText, setCsvText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const sampleHeaders = 'Name,Department,Year,Section,Position,Academic Year,Joining Date,Status,Photo URL,Email,Blood Group\n';
    const blob = new Blob([sampleHeaders], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'UHV_NBKRIST_Student_Import_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!csvText.trim()) return;
    setIsProcessing(true);
    try {
      const res = storageService.bulkImportCSV(csvText);
      setResult(res);
      if (res.added > 0) {
        onImportComplete();
      }
    } catch (err: unknown) {
      setResult({
        added: 0,
        errors: [(err as Error).message || 'Failed to process CSV import.'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0f2942] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base sm:text-lg">
              Bulk Member CSV Import
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
            <div>
              <p className="text-xs text-slate-600">
                Upload or paste a comma-separated value (CSV) list of members.
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                Zero ID Rule: Tokens and QR codes are auto-generated. No ID or roll number required.
              </p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          {result && (
            <div
              className={`mb-4 p-4 rounded-xl border text-xs ${
                result.added > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {result.added > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                Import Status
              </div>
              <p>
                Successfully imported <strong>{result.added}</strong> members with generated secure QR tokens.
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* File Upload Box */}
          <div className="mb-4">
            <label className="border-2 border-dashed border-slate-300 hover:border-[#0f2942] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                Click to Select CSV File
              </span>
              <span className="text-[10px] text-slate-400">
                Standard UTF-8 formatted .csv file
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Raw CSV Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Or Paste CSV Data Directly:
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Name,Department,Year,Section,Role,Academic Year,Joining Date,Status,Photo URL,Email,Blood Group&#10;Sample Student,Electrical and Electronics Engineering,III B.Tech,A,Volunteer,2026–27,01/08/2026,Active,,student@nbkrist.org,O+"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={handleImport}
              disabled={isProcessing || !csvText.trim()}
              className="px-5 py-2 rounded-xl bg-[#0f2942] text-white text-xs font-bold hover:bg-[#163a5e] disabled:opacity-50 shadow-xs"
            >
              {isProcessing ? 'Processing Members...' : 'Execute CSV Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
