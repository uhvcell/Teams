import React, { useState } from 'react';
import { Member } from '../types';
import { UHVLogo } from './UHVLogo';
import { StatusBadge } from './StatusBadge';
import { MemberPhoto } from './MemberPhoto';
import { CheckCircle2, ShieldCheck, Printer, Share2, ArrowLeft, AlertTriangle, Calendar, Building, GraduationCap, Award, HeartHandshake } from 'lucide-react';

interface StudentProfileProps {
  member: Member;
  onBack?: () => void;
  isAdmin?: boolean;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ member, onBack }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `UHV CELL NBKRIST Member Profile - ${member.name}`,
          text: `Verified Universal Human Values Cell Member Profile: ${member.name}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isVerified = member.status === 'Active';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      {/* Top navigation actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>
        ) : (
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </a>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            title="Share verification link"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? 'Link Copied!' : 'Share'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
            title="Print Official Profile"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Header Ribbon / University Seal Banner */}
        <div className="bg-gradient-to-r from-[#0f2942] via-[#16395b] to-[#0f2942] text-white p-6 sm:p-8 text-center relative overflow-hidden border-b-4 border-amber-400">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* OFFICIAL UHV LOGO */}
            <div className="p-1.5 bg-white rounded-full shadow-lg mb-3">
              <UHVLogo size="lg" />
            </div>

            <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-1">
              NBKR Institute of Science & Technology
            </span>

            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-white">
              UHV CELL – NBKRIST
            </h1>

            <p className="text-sm text-slate-200 font-medium">
              Universal Human Values Cell
            </p>

            <div className="mt-3 inline-block px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full border border-white/20">
              <span className="text-xs tracking-wider uppercase font-semibold text-amber-200">
                OFFICIAL STUDENT VERIFICATION
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
          {isVerified ? (
            <div className="inline-flex items-center gap-2 text-emerald-800 bg-emerald-100/80 px-4 py-2 rounded-full border border-emerald-300/80 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm sm:text-base tracking-wide">
                ✓ VERIFIED UHV CELL STUDENT
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-rose-800 bg-rose-100/80 px-4 py-2 rounded-full border border-rose-300/80 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-bold text-sm sm:text-base tracking-wide">
                STUDENT RECORD INACTIVE OR UNVERIFIED
              </span>
            </div>
          )}
        </div>

        {/* Profile Content Details */}
        <div className="p-6 sm:p-8">
          {/* Member Photo & Primary Identification */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
            <div className="relative shrink-0">
              <MemberPhoto
                photoUrl={member.photoUrl}
                name={member.name}
                size="xl"
                shape="rounded"
                className="border-2 border-[#0f2942]/20 shadow-md"
              />
              <div className="absolute -bottom-2 -right-2">
                <StatusBadge status={member.status} size="sm" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <span className="text-xs font-semibold text-[#0f2942] uppercase tracking-wider">
                Student Name
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                {member.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-[#0f2942] text-amber-300">
                  <Award className="w-3.5 h-3.5" />
                  {member.position || member.role}
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                  Academic Year: {member.academicYear}
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-500 italic">
                “Building Understanding, Responsibility and Co-Existence”
              </p>
            </div>
          </div>

          {/* Detailed Academic & Member Information Grid */}
          {/* CRITICAL NOTE: NO UHV ID, NO Roll Number, NO Student ID, NO Internal QR token! */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-6 text-left">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Building className="w-4 h-4 text-[#0f2942]" />
                Department
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900">
                {member.department}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <GraduationCap className="w-4 h-4 text-[#0f2942]" />
                Year
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900">
                {member.year}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-[#0f2942]" />
                Section
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900">
                Section {member.section}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-[#0f2942]" />
                Position / Team
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900">
                {member.position || member.role}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4 text-[#0f2942]" />
                Academic Year
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900">
                {member.academicYear}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4 text-[#0f2942]" />
                {member.issueDate ? 'Issue / Joining Date' : 'Joining Date'}
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900">
                {member.issueDate || member.joiningDate}
              </p>
            </div>

            {member.certificateNumber && (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#0f2942]" />
                  Student Verification ID
                </div>
                <p className="text-sm sm:text-base font-mono font-bold text-slate-900">
                  {member.certificateNumber}
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </div>
              <div>
                <StatusBadge status={member.status} size="md" />
              </div>
            </div>

            {member.bloodGroup && (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Blood Group
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-900">
                  {member.bloodGroup}
                </p>
              </div>
            )}
          </div>

          {/* Values Commitment & Verification Seal */}
          <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-left">
            <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold block text-amber-950 mb-0.5">
                Universal Human Values Pledge
              </span>
              This member is dedicated to embodying human values of Trust, Respect, Affection, and Responsibility, actively contributing toward mutual happiness and mutual prosperity in the campus community.
            </div>
          </div>

          {/* Privacy & Identifier Compliance Notice */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Digital Member Verification Portal • N.B.K.R. Institute of Science & Technology
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Secure QR Verification Protocol Active • Zero Student ID Exposure Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
