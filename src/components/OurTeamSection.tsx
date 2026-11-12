import React, { useEffect, useState } from 'react';
import { Member } from '../types';
import { storageService, isAiMockStudent } from '../services/storage';
import { firestoreStudentsService, IS_FIREBASE_ENABLED } from '../services/firebase';
import { StatusBadge } from './StatusBadge';
import { MemberPhoto } from './MemberPhoto';
import {
  Award,
  Crown,
  ShieldCheck,
  GraduationCap,
  Building,
  CheckCircle2,
  Users,
  Code,
  Calendar,
  Palette,
  Sparkles,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';

interface OurTeamSectionProps {
  onSelectMember?: (token: string) => void;
}

interface TeamSectionDef {
  key: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  order: number;
  match: (pos: string) => boolean;
  isLeadership?: boolean;
}

export const OurTeamSection: React.FC<OurTeamSectionProps> = ({ onSelectMember }) => {
  const [members, setMembers] = useState<Member[]>(() => storageService.getMembers());
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic real-time loading from Cloud Firestore
  useEffect(() => {
    let isMounted = true;

    const loadLiveMembers = async () => {
      // First populate with local storage for instant render
      const local = storageService.getMembers();
      if (isMounted) setMembers(local);

      if (IS_FIREBASE_ENABLED) {
        try {
          setIsLoading(true);
          const cloud = await firestoreStudentsService.getAllStudents();
          if (isMounted && cloud && cloud.length > 0) {
            const deleted = storageService.getDeletedTokens();
            const validCloud = cloud.filter((m) => !deleted.includes(m.qrToken) && !isAiMockStudent(m));
            const currentLocal = storageService.getMembers().filter((m) => !deleted.includes(m.qrToken) && !isAiMockStudent(m));
            const memberMap = new Map<string, Member>();
            for (const lm of currentLocal) memberMap.set(lm.qrToken.toLowerCase(), lm);
            for (const cm of validCloud) memberMap.set(cm.qrToken.toLowerCase(), cm);
            const merged = Array.from(memberMap.values());
            setMembers(merged);
            // Sync locally as well
            storageService.saveMembers(merged);
          }
        } catch (err) {
          console.warn('[OurTeamSection] Firestore sync note:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    loadLiveMembers();

    // Listen for storage changes
    const handleStorageUpdate = () => {
      setMembers(storageService.getMembers());
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('uhv_members_updated', handleStorageUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('uhv_members_updated', handleStorageUpdate);
    };
  }, []);

  // Standard ordered sections according to Section 7:
  // 1. President
  // 2. Vice-President
  // 3. Core Team
  // 4. Coordinators
  // 5. Technical Team
  // 6. Event Management Team
  // 7. Designing Team
  // 8. Innovation Team
  // 9. Volunteers
  const standardSections: TeamSectionDef[] = [
    {
      key: 'president',
      title: 'President',
      subtitle: 'Executive Student Leadership',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      order: 1,
      isLeadership: true,
      match: (pos: string) => /^president$/i.test(pos.trim()),
    },
    {
      key: 'vice_president',
      title: 'Vice-President',
      subtitle: 'Executive Student Leadership',
      icon: <Award className="w-5 h-5 text-purple-400" />,
      order: 2,
      isLeadership: true,
      match: (pos: string) => /^vice[-\s]?president$/i.test(pos.trim()),
    },
    {
      key: 'core_team',
      title: 'Core Team',
      subtitle: 'Foundational Steering & Coordination',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
      order: 3,
      match: (pos: string) => /^core(\s+team)?$/i.test(pos.trim()),
    },
    {
      key: 'coordinators',
      title: 'Coordinators',
      subtitle: 'Campus Initiatives & Operations',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      order: 4,
      match: (pos: string) => /^coordinators?$/i.test(pos.trim()),
    },
    {
      key: 'technical_team',
      title: 'Technical Team',
      subtitle: 'Digital Verification & Systems Management',
      icon: <Code className="w-5 h-5 text-cyan-600" />,
      order: 5,
      match: (pos: string) => /^technical(\s+team)?$/i.test(pos.trim()) || /^tech(\s+team)?$/i.test(pos.trim()),
    },
    {
      key: 'event_management',
      title: 'Event Management Team',
      subtitle: 'Workshops, Induction & Seminars',
      icon: <Calendar className="w-5 h-5 text-rose-500" />,
      order: 6,
      match: (pos: string) => /^event(\s+management)?(\s+team)?$/i.test(pos.trim()),
    },
    {
      key: 'designing_team',
      title: 'Designing Team',
      subtitle: 'Creative Media, Posters & Values Outreach',
      icon: <Palette className="w-5 h-5 text-fuchsia-500" />,
      order: 7,
      match: (pos: string) => /^desig?i?ning(\s+team)?$/i.test(pos.trim()),
    },
    {
      key: 'innovation_team',
      title: 'Innovation Team',
      subtitle: 'Values Exploration & Peer Dialogue Formats',
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      order: 8,
      match: (pos: string) => /^in+ovations?(\s+team)?$/i.test(pos.trim()),
    },
    {
      key: 'volunteers',
      title: 'Volunteers',
      subtitle: 'Community Service & Peer Harmony Facilitation',
      icon: <HeartHandshake className="w-5 h-5 text-amber-600" />,
      order: 999, // Placed last
      match: (pos: string) => /^volunteers?$/i.test(pos.trim()),
    },
  ];

  // Identify any custom positions that do not match the standard sections
  const customSectionMap = new Map<string, Member[]>();
  const matchedMembersSet = new Set<string>();

  // Filter out permanently deleted tokens and AI mock students
  const deletedTokens = storageService.getDeletedTokens();
  const validMembers = members.filter((m) => !deletedTokens.includes(m.qrToken) && !isAiMockStudent(m));

  // Partition standard members, sorted strictly by manual displayOrder ascending
  const standardBuckets: { section: TeamSectionDef; members: Member[] }[] = standardSections.map((sec) => {
    const matched = validMembers
      .filter((m) => {
        const pos = m.position || m.role || '';
        return sec.match(pos);
      })
      .sort((a, b) => {
        const orderA = typeof a.displayOrder === 'number' && a.displayOrder > 0 ? a.displayOrder : 999999;
        const orderB = typeof b.displayOrder === 'number' && b.displayOrder > 0 ? b.displayOrder : 999999;
        return orderA - orderB;
      });
    matched.forEach((m) => matchedMembersSet.add(m.qrToken));
    return { section: sec, members: matched };
  });

  // Collect unmatched members into custom team sections
  validMembers.forEach((m) => {
    if (!matchedMembersSet.has(m.qrToken)) {
      const pos = (m.position || m.role || 'Other').trim();
      if (!customSectionMap.has(pos)) {
        customSectionMap.set(pos, []);
      }
      customSectionMap.get(pos)?.push(m);
    }
  });

  // Sort members in custom sections by displayOrder ascending
  customSectionMap.forEach((list) => {
    list.sort((a, b) => {
      const orderA = typeof a.displayOrder === 'number' && a.displayOrder > 0 ? a.displayOrder : 999999;
      const orderB = typeof b.displayOrder === 'number' && b.displayOrder > 0 ? b.displayOrder : 999999;
      return orderA - orderB;
    });
  });

  // Leadership group (President + Vice-President)
  const presidentGroup = standardBuckets.find((b) => b.section.key === 'president')?.members || [];
  const vpGroup = standardBuckets.find((b) => b.section.key === 'vice_president')?.members || [];
  const hasLeadership = presidentGroup.length > 0 || vpGroup.length > 0;

  // Other standard teams (Core, Coordinators, Tech, Event, Design, Innovation, Volunteers)
  const teamBuckets = standardBuckets.filter(
    (b) => !b.section.isLeadership && b.members.length > 0
  );

  // Convert custom sections to array (only if they have members)
  const customSections = Array.from(customSectionMap.entries())
    .filter(([, list]) => list.length > 0)
    .map(([name, list], index) => ({
      key: `custom_${index}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      title: name,
      subtitle: 'UHV Cell Specialized Division',
      icon: <Award className="w-5 h-5 text-slate-600" />,
      order: 100 + index,
      members: list,
    }));

  const handleCardClick = (token: string) => {
    if (onSelectMember) {
      onSelectMember(token);
    } else {
      window.location.href = `/student/${token}`;
    }
  };

  return (
    <section id="our-team" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-3 border border-blue-100">
            <Users className="w-4 h-4 text-blue-600" />
            Universal Human Values Cell
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            Our Team
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Dedicated students, coordinators, and facilitators fostering mutual trust, ethical conduct, and campus harmony through self-exploration.
          </p>
          {isLoading && (
            <div className="mt-2 text-xs text-slate-400 italic">
              Syncing live student directory...
            </div>
          )}
        </div>

        {/* Empty State when no students enrolled yet */}
        {members.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Student Records Enrolled Yet</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Authorized administrators can enroll students and generate verification QR codes through the Administrator Portal.
            </p>
          </div>
        )}

        {/* 1. LEADERSHIP SECTION (PRESIDENT & VICE-PRESIDENT) */}
        {hasLeadership && (
          <div className="mb-16">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
                <Crown className="w-4 h-4 text-amber-600" />
                LEADERSHIP
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 text-center">
                Executive Student Leadership
              </h3>
            </div>

            {/* Prominent Leadership Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* President Cards */}
              {presidentGroup.map((leader) => (
                <div
                  key={leader.qrToken}
                  className="bg-white rounded-3xl border-2 border-amber-300 shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group transform hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-r from-[#0f2942] via-[#173e63] to-[#0f2942] p-5 text-white text-center relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-bold text-xs uppercase tracking-wider shadow-sm">
                      <Crown className="w-3.5 h-3.5" />
                      President
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex flex-col items-center text-center flex-1">
                    {/* Photo */}
                    <div className="relative mb-5">
                      <MemberPhoto
                        photoUrl={leader.photoUrl}
                        name={leader.name}
                        size="xl"
                        shape="circle"
                        className="border-4 border-amber-400/80 shadow-md"
                      />
                      <div className="absolute bottom-0 right-1">
                        <StatusBadge status={leader.status} size="sm" />
                      </div>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#0f2942] transition-colors">
                      {leader.name}
                    </h4>

                    <div className="inline-block px-3 py-1 mt-1.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                      {leader.position || leader.role}
                    </div>

                    {/* Member Details */}
                    <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" /> Department:
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {leader.department}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" /> Year & Sec:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {leader.year} • Sec {leader.section}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Academic Year:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {leader.academicYear}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Action */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => handleCardClick(leader.qrToken)}
                      className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#1a3f65] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Verify Official Profile
                    </button>
                  </div>
                </div>
              ))}

              {/* Vice-President Cards */}
              {vpGroup.map((leader) => (
                <div
                  key={leader.qrToken}
                  className="bg-white rounded-3xl border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group transform hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] p-5 text-white text-center relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-300 text-purple-950 font-bold text-xs uppercase tracking-wider shadow-sm">
                      <Award className="w-3.5 h-3.5" />
                      Vice-President
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex flex-col items-center text-center flex-1">
                    {/* Photo */}
                    <div className="relative mb-5">
                      <MemberPhoto
                        photoUrl={leader.photoUrl}
                        name={leader.name}
                        size="xl"
                        shape="circle"
                        className="border-4 border-purple-300/80 shadow-md"
                      />
                      <div className="absolute bottom-0 right-1">
                        <StatusBadge status={leader.status} size="sm" />
                      </div>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#0f2942] transition-colors">
                      {leader.name}
                    </h4>

                    <div className="inline-block px-3 py-1 mt-1.5 rounded-lg bg-purple-50 text-purple-900 text-xs font-bold border border-purple-200">
                      {leader.position || leader.role}
                    </div>

                    {/* Member Details */}
                    <div className="w-full mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" /> Department:
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {leader.department}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" /> Year & Sec:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {leader.year} • Sec {leader.section}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Academic Year:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {leader.academicYear}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Action */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => handleCardClick(leader.qrToken)}
                      className="w-full py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#1a3f65] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Verify Official Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. TEAMS SECTIONS (Core Team, Coordinators, Technical Team, Event Management, Designing, Innovation, Custom Teams, Volunteers) */}
        {/* Strictly hide any section that has 0 members! */}
        <div className="space-y-16">
          {teamBuckets.map(({ section, members: teamMembers }) => (
            <div key={section.key} className="space-y-6">
              {/* Section Subheading */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 tracking-tight uppercase">
                      {section.title}
                    </h3>
                    {section.subtitle && (
                      <p className="text-xs text-slate-500 font-medium">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  {teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {/* Responsive Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <div
                    key={member.qrToken}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#0f2942]/30"
                  >
                    <div>
                      {/* Photo & Name Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative shrink-0">
                          <MemberPhoto
                            photoUrl={member.photoUrl}
                            name={member.name}
                            size="md"
                            shape="rounded"
                            className="border border-slate-200 shadow-2xs"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-slate-900 truncate group-hover:text-[#0f2942] transition-colors">
                            {member.name}
                          </h4>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-[#0f2942] border border-slate-200/80">
                            {member.position || member.role}
                          </span>
                        </div>
                      </div>

                      {/* Approved Public Info Fields */}
                      <div className="space-y-1.5 text-xs text-slate-600 pb-4 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 font-medium">Department:</span>
                          <span className="font-semibold text-slate-800 text-right truncate">
                            {member.department}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Class:</span>
                          <span className="font-semibold text-slate-800">
                            {member.year} • Sec {member.section}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Academic Year:</span>
                          <span className="font-semibold text-slate-800">
                            {member.academicYear}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-400 font-medium">Status:</span>
                          <StatusBadge status={member.status} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Verify Profile */}
                    <div className="mt-4 pt-1">
                      <button
                        onClick={() => handleCardClick(member.qrToken)}
                        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#0f2942] hover:text-white text-[#0f2942] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 hover:border-transparent"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-400" />
                        Verify Digital Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 3. DYNAMIC CUSTOM TEAMS (Added in future by Admin) */}
          {customSections.map((sec) => (
            <div key={sec.key} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    {sec.icon}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 tracking-tight uppercase">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{sec.subtitle}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  {sec.members.length} {sec.members.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sec.members.map((member) => (
                  <div
                    key={member.qrToken}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#0f2942]/30"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative shrink-0">
                          <MemberPhoto
                            photoUrl={member.photoUrl}
                            name={member.name}
                            size="md"
                            shape="rounded"
                            className="border border-slate-200 shadow-2xs"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-slate-900 truncate group-hover:text-[#0f2942] transition-colors">
                            {member.name}
                          </h4>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-[#0f2942] border border-slate-200/80">
                            {member.position || member.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pb-4 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 font-medium">Department:</span>
                          <span className="font-semibold text-slate-800 text-right truncate">
                            {member.department}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Class:</span>
                          <span className="font-semibold text-slate-800">
                            {member.year} • Sec {member.section}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Academic Year:</span>
                          <span className="font-semibold text-slate-800">
                            {member.academicYear}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-400 font-medium">Status:</span>
                          <StatusBadge status={member.status} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-1">
                      <button
                        onClick={() => handleCardClick(member.qrToken)}
                        className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#0f2942] hover:text-white text-[#0f2942] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 hover:border-transparent"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-400" />
                        Verify Digital Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
