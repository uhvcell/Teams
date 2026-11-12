import React from 'react';
import { Save, UploadCloud, RotateCcw, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface SuperAdminWorkflowBarProps {
  hasChanges: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDiscard: () => void;
  previewMode: boolean;
  onTogglePreview: (enabled: boolean) => void;
}

export const SuperAdminWorkflowBar: React.FC<SuperAdminWorkflowBarProps> = ({
  hasChanges,
  onSaveDraft,
  onPublish,
  onDiscard,
  previewMode,
  onTogglePreview,
}) => {
  return (
    <div className="sticky top-20 z-30 mb-6 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                {hasChanges ? 'Draft Modifications Pending' : 'Live Website Synchronized'}
              </span>
              {hasChanges ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Unpublished
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Published Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {hasChanges
                ? 'Your changes are saved in local draft mode. Click "Publish Live Website" to push changes to all public visitors.'
                : 'All public visitors currently see these live website settings and values.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Live Preview Toggle */}
          <button
            type="button"
            onClick={() => onTogglePreview(!previewMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              previewMode
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Preview how changes look before publishing"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Exit Draft Preview' : 'Preview Live Draft'}</span>
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Discard unpublished changes and revert to published version"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all transform active:scale-95 ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-[#0f2942] hover:bg-[#163a5e]'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-amber-300" />
            <span>Publish Live Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};
