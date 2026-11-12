import React from 'react';
import { UHVLogo } from './UHVLogo';
import { AlertOctagon, ArrowLeft, HelpCircle } from 'lucide-react';

interface InvalidMemberProps {
  onBack?: () => void;
  onScanAnother?: () => void;
  reason?: 'not_found' | 'inactive' | 'removed';
}

export const InvalidMember: React.FC<InvalidMemberProps> = ({
  onBack,
  onScanAnother,
  reason = 'not_found',
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12 animate-fade-in text-center">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-8 sm:p-10">
        {/* Official Logo */}
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-slate-50 rounded-full border border-slate-100 shadow-xs">
            <UHVLogo size="lg" />
          </div>
        </div>

        {/* Official Cell Titles */}
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
          UHV CELL – NBKRIST
        </h1>
        <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider mt-1">
          Universal Human Values Cell
        </p>

        {/* Warning Icon */}
        <div className="my-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
          <AlertOctagon className="w-9 h-9" />
        </div>

        {/* Headline */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {reason === 'inactive' ? 'Student Record Inactive or Unverified' : 'Student Not Found'}
        </h2>

        {/* Professional Message */}
        <p className="text-base font-medium text-slate-700 mb-4 italic">
          {reason === 'inactive'
            ? '“This student record is currently marked inactive or unverified by cell administration.”'
            : '“Student Not Found: This QR code is invalid, unregistered, or the student record does not exist in the official UHV database.”'}
        </p>

        {/* Required Administrator Contact text */}
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Please contact the UHV Cell administration to ensure your official student verification record is currently active and registered.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onScanAnother && (
            <button
              onClick={onScanAnother}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#19436a] text-white font-semibold text-sm shadow-md transition-colors"
            >
              Scan Another QR Code
            </button>
          )}

          {onBack ? (
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Return to Home
            </button>
          ) : (
            <a
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </a>
          )}
        </div>

        {/* Institutional Contact Info */}
        <div className="mt-6 text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Universal Human Values Cell • NBKRIST, Vidyanagar</span>
        </div>
      </div>
    </div>
  );
};
