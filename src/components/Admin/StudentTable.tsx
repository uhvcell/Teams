import React, { useState } from 'react';
import { Member } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { MemberPhoto } from '../MemberPhoto';
import {
  Eye, Edit, QrCode, Printer, Power, Trash2, Camera, ArrowUpDown,
  Crown, Award, ShieldCheck, Users, Code, Calendar, Palette, Sparkles,
  HeartHandshake, Layers,
} from 'lucide-react';
import { renderMemberQRCardToCanvas } from '../../services/qrService';
import { isAiMockStudent } from '../../services/storage';

interface StudentTableProps {
  members: Member[];
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onPreviewQR: (member: Member) => void;
  onToggleStatus: (member: Member) => void;
  onDelete?: (member: Member) => void;
  onManagePhoto?: (member: Member) => void;
  onManageOrder?: () => void;
}

// ─── Hierarchy definition (matches OurTeamSection.tsx order exactly) ─────────
interface GroupDef {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  match: (pos: string) => boolean;
  order: number;
}

const GROUP_DEFS: GroupDef[] = [
  {
    key: 'president',
    title: 'President',
    subtitle: 'Executive Student Leadership',
    icon: <Crown className="w-4 h-4" />,
    headerBg: 'bg-amber-50 border-amber-200',
    headerText: 'text-amber-900',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    order: 1,
    match: (p) => /^president$/i.test(p.trim()),
  },
  {
    key: 'vice_president',
    title: 'Vice-President',
    subtitle: 'Executive Student Leadership',
    icon: <Award className="w-4 h-4" />,
    headerBg: 'bg-purple-50 border-purple-200',
    headerText: 'text-purple-900',
    badgeBg: 'bg-purple-100 border-purple-200',
    badgeText: 'text-purple-900',
    order: 2,
    match: (p) => /^vice[-\s]?president$/i.test(p.trim()),
  },
  {
    key: 'core_team',
    title: 'Core Team',
    subtitle: 'Foundational Steering & Coordination',
    icon: <ShieldCheck className="w-4 h-4" />,
    headerBg: 'bg-indigo-50 border-indigo-200',
    headerText: 'text-indigo-900',
    badgeBg: 'bg-indigo-100 border-indigo-200',
    badgeText: 'text-indigo-900',
    order: 3,
    match: (p) => /^core(\s+team)?$/i.test(p.trim()),
  },
  {
    key: 'coordinators',
    title: 'Coordinators',
    subtitle: 'Campus Initiatives & Operations',
    icon: <Users className="w-4 h-4" />,
    headerBg: 'bg-blue-50 border-blue-200',
    headerText: 'text-blue-900',
    badgeBg: 'bg-blue-100 border-blue-200',
    badgeText: 'text-blue-900',
    order: 4,
    match: (p) => /^coordinators?$/i.test(p.trim()),
  },
  {
    key: 'technical_team',
    title: 'Technical Team',
    subtitle: 'Digital Verification & Systems Management',
    icon: <Code className="w-4 h-4" />,
    headerBg: 'bg-cyan-50 border-cyan-200',
    headerText: 'text-cyan-900',
    badgeBg: 'bg-cyan-100 border-cyan-200',
    badgeText: 'text-cyan-900',
    order: 5,
    match: (p) =>
      /^technical(\s+team)?$/i.test(p.trim()) ||
      /^tech(\s+team)?$/i.test(p.trim()),
  },
  {
    key: 'event_management',
    title: 'Event Management Team',
    subtitle: 'Workshops, Induction & Seminars',
    icon: <Calendar className="w-4 h-4" />,
    headerBg: 'bg-rose-50 border-rose-200',
    headerText: 'text-rose-900',
    badgeBg: 'bg-rose-100 border-rose-200',
    badgeText: 'text-rose-900',
    order: 6,
    match: (p) => /^event(\s+management)?(\s+team)?$/i.test(p.trim()),
  },
  {
    key: 'designing_team',
    title: 'Designing Team',
    subtitle: 'Creative Media, Posters & Values Outreach',
    icon: <Palette className="w-4 h-4" />,
    headerBg: 'bg-fuchsia-50 border-fuchsia-200',
    headerText: 'text-fuchsia-900',
    badgeBg: 'bg-fuchsia-100 border-fuchsia-200',
    badgeText: 'text-fuchsia-900',
    order: 7,
    match: (p) => /^desig?i?ning(\s+team)?$/i.test(p.trim()),
  },
  {
    key: 'innovation_team',
    title: 'Innovation Team',
    subtitle: 'Values Exploration & Peer Dialogue Formats',
    icon: <Sparkles className="w-4 h-4" />,
    headerBg: 'bg-emerald-50 border-emerald-200',
    headerText: 'text-emerald-900',
    badgeBg: 'bg-emerald-100 border-emerald-200',
    badgeText: 'text-emerald-900',
    order: 8,
    match: (p) => /^in+ovations?(\s+team)?$/i.test(p.trim()),
  },
  {
    key: 'volunteers',
    title: 'Volunteers',
    subtitle: 'Community Service & Peer Harmony Facilitation',
    icon: <HeartHandshake className="w-4 h-4" />,
    headerBg: 'bg-amber-50 border-amber-200',
    headerText: 'text-amber-800',
    badgeBg: 'bg-amber-100 border-amber-200',
    badgeText: 'text-amber-800',
    order: 999,
    match: (p) => /^volunteers?$/i.test(p.trim()),
  },
];

// ─── Helper: resolve which group a member belongs to ─────────────────────────
function resolveGroup(member: Member): GroupDef | null {
  const pos = (member.position || member.role || '').trim();
  return GROUP_DEFS.find((g) => g.match(pos)) ?? null;
}

// ─── Sub-component: single member row ────────────────────────────────────────
const MemberRow: React.FC<{
  member: Member;
  badgeBg: string;
  badgeText: string;
  printingToken: string | null;
  onView: (m: Member) => void;
  onEdit: (m: Member) => void;
  onPreviewQR: (m: Member) => void;
  onToggleStatus: (m: Member) => void;
  onPrint: (m: Member) => void;
  onDelete?: (m: Member) => void;
  onManagePhoto?: (m: Member) => void;
}> = ({
  member,
  badgeBg,
  badgeText,
  printingToken,
  onView,
  onEdit,
  onPreviewQR,
  onToggleStatus,
  onPrint,
  onDelete,
  onManagePhoto,
}) => {
  const displayPos = member.position || member.role;

  return (
    <tr className="hover:bg-slate-50/70 transition-colors group">
      {/* Photo */}
      <td className="py-3 px-4">
        <button
          type="button"
          onClick={() => (onManagePhoto ? onManagePhoto(member) : onEdit(member))}
          title={`Update photo for ${member.name}`}
          className="relative group/photo shrink-0 cursor-pointer focus:outline-hidden"
        >
          <MemberPhoto
            photoUrl={member.photoUrl}
            name={member.name}
            size="sm"
            shape="rounded"
            showStatusIndicator={true}
          />
          <span className="absolute inset-0 bg-[#0f2942]/60 rounded-xl opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-amber-300" />
          </span>
        </button>
      </td>

      {/* Name */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 group-hover:text-[#0f2942]">
            {member.name}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Joined {member.joiningDate}
          </span>
        </div>
      </td>

      {/* Department */}
      <td className="py-3 px-4 text-slate-700 font-medium text-xs">
        {member.department}
      </td>

      {/* Year & Section */}
      <td className="py-3 px-4 text-slate-600 text-xs">
        {member.year} • Sec {member.section}
      </td>

      {/* Position Badge */}
      <td className="py-3 px-4">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg} ${badgeText}`}>
          {typeof member.displayOrder === 'number' && (
            <span className="font-mono text-[10px] opacity-60 mr-1">
              #{member.displayOrder}
            </span>
          )}
          {displayPos}
        </span>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <StatusBadge status={member.status} size="sm" />
      </td>

      {/* QR Button */}
      <td className="py-3 px-4 text-center">
        <button
          onClick={() => onPreviewQR(member)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0f2942] hover:text-white text-slate-700 transition-colors inline-flex items-center justify-center"
          title="Preview / Download QR Card"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(member)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 transition-colors"
            title="View Digital Profile"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(member)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            title="Edit Member Details"
          >
            <Edit className="w-4 h-4" />
          </button>

          {onManagePhoto && (
            <button
              onClick={() => onManagePhoto(member)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 transition-colors"
              title="Update / Replace Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onPrint(member)}
            disabled={printingToken === member.qrToken}
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="Print Official QR Card"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleStatus(member)}
            className={`p-1.5 rounded-lg transition-colors ${
              member.status === 'Active'
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
            title={member.status === 'Active' ? 'Deactivate Member' : 'Reactivate Member'}
          >
            <Power className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              id={`delete-student-${member.qrToken}`}
              onClick={() => onDelete(member)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Student Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Sub-component: group section header row ──────────────────────────────────
const GroupHeaderRow: React.FC<{
  group: GroupDef;
  count: number;
}> = ({ group, count }) => (
  <tr>
    <td colSpan={8} className={`px-4 py-2.5 border-b border-t ${group.headerBg}`}>
      <div className="flex items-center gap-2">
        <span className={group.headerText}>{group.icon}</span>
        <div className="flex flex-col leading-tight">
          <span className={`text-xs font-bold uppercase tracking-wider ${group.headerText}`}>
            {group.title}
          </span>
          {group.subtitle && (
            <span className="text-[10px] text-slate-500">{group.subtitle}</span>
          )}
        </div>
        <span className={`ml-auto inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold border ${group.badgeBg} ${group.badgeText}`}>
          {count}
        </span>
      </div>
    </td>
  </tr>
);

// ─── Main export ──────────────────────────────────────────────────────────────
export const StudentTable: React.FC<StudentTableProps> = ({
  members,
  onView,
  onEdit,
  onPreviewQR,
  onToggleStatus,
  onDelete,
  onManagePhoto,
  onManageOrder,
}) => {
  const [printingToken, setPrintingToken] = useState<string | null>(null);

  const handlePrintMember = async (member: Member) => {
    try {
      setPrintingToken(member.qrToken);
      const canvas = await renderMemberQRCardToCanvas(member);
      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>UHV QR Card - ${member.name}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
                img { max-width: 460px; width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setPrintingToken(null);
    }
  };

  const visibleMembers = members.filter((m) => !isAiMockStudent(m));

  if (visibleMembers.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-medium text-slate-500">
          No student members found matching the criteria.
        </p>
      </div>
    );
  }

  // ── Partition members into groups ─────────────────────────────────────────
  const groupedMap = new Map<string, Member[]>();
  GROUP_DEFS.forEach((g) => groupedMap.set(g.key, []));

  const otherMembers: Member[] = [];
  const otherCustomMap = new Map<string, Member[]>(); // key = raw position string

  for (const member of visibleMembers) {
    const grp = resolveGroup(member);
    if (grp) {
      groupedMap.get(grp.key)!.push(member);
    } else {
      const pos = (member.position || member.role || 'Other').trim();
      if (!otherCustomMap.has(pos)) otherCustomMap.set(pos, []);
      otherCustomMap.get(pos)!.push(member);
      otherMembers.push(member);
    }
  }

  // Sort each standard group by displayOrder
  GROUP_DEFS.forEach((g) => {
    groupedMap.get(g.key)!.sort(
      (a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)
    );
  });

  // Build ordered render list: standard groups then custom groups
  const renderGroups: Array<{ def: GroupDef | null; customTitle?: string; list: Member[] }> = [];

  GROUP_DEFS.slice()
    .sort((a, b) => a.order - b.order)
    .forEach((g) => {
      const list = groupedMap.get(g.key)!;
      if (list.length > 0) renderGroups.push({ def: g, list });
    });

  // Custom / uncategorised positions
  otherCustomMap.forEach((list, posTitle) => {
    renderGroups.push({
      def: null,
      customTitle: posTitle,
      list: list.sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)),
    });
  });

  const TABLE_HEADER = (
    <thead>
      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
        <th className="py-3.5 px-4">Photo</th>
        <th className="py-3.5 px-4">Student Name</th>
        <th className="py-3.5 px-4">Department</th>
        <th className="py-3.5 px-4">Year & Sec</th>
        <th className="py-3.5 px-4">Position / Team</th>
        <th className="py-3.5 px-4">Status</th>
        <th className="py-3.5 px-4 text-center">QR</th>
        <th className="py-3.5 px-4 text-right">Actions</th>
      </tr>
    </thead>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Enrolled Student Members ({visibleMembers.length})
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Grouped by team hierarchy — President → Vice-President → Core Team → Coordinators → Technical → Event Management → Designing → Innovation → Volunteers
          </p>
        </div>
        {onManageOrder && (
          <button
            onClick={onManageOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs transition-colors shrink-0"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
            Manage Display Order
          </button>
        )}
      </div>

      {/* Grouped table sections */}
      <div className="overflow-x-auto">
        {renderGroups.map(({ def, customTitle, list }, idx) => {
          const isCustom = def === null;
          const groupBadgeBg = isCustom ? 'bg-slate-100 border-slate-300' : def!.badgeBg;
          const groupBadgeText = isCustom ? 'text-slate-700' : def!.badgeText;

          const headerContent = isCustom ? (
            <tr>
              <td colSpan={8} className="px-4 py-2.5 border-b border-t bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {customTitle}
                    </span>
                    <span className="text-[10px] text-slate-400">Custom / Other Position</span>
                  </div>
                  <span className="ml-auto inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold border bg-slate-100 border-slate-300 text-slate-700">
                    {list.length}
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            <GroupHeaderRow key={def!.key} group={def!} count={list.length} />
          );

          return (
            <table key={idx} className="w-full text-left border-collapse">
              {idx === 0 ? TABLE_HEADER : null}
              <tbody className="divide-y divide-slate-100 text-xs">
                {headerContent}
                {list.map((member) => (
                  <MemberRow
                    key={member.qrToken}
                    member={member}
                    badgeBg={groupBadgeBg}
                    badgeText={groupBadgeText}
                    printingToken={printingToken}
                    onView={onView}
                    onEdit={onEdit}
                    onPreviewQR={onPreviewQR}
                    onToggleStatus={onToggleStatus}
                    onPrint={handlePrintMember}
                    onDelete={onDelete}
                    onManagePhoto={onManagePhoto}
                  />
                ))}
              </tbody>
            </table>
          );
        })}
      </div>
    </div>
  );
};
