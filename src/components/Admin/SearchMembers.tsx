import React, { useState } from 'react';
import { Member, MemberRole, MemberStatus, MEMBER_ROLES } from '../../types';
import { storageService } from '../../services/storage';
import { StudentTable } from './StudentTable';
import { Search, Filter, RotateCcw, ShieldCheck } from 'lucide-react';

interface SearchMembersProps {
  members: Member[];
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onPreviewQR: (member: Member) => void;
  onToggleStatus: (member: Member) => void;
  onDelete?: (member: Member) => void;
  onManagePhoto?: (member: Member) => void;
}

export const SearchMembers: React.FC<SearchMembersProps> = ({
  members,
  onView,
  onEdit,
  onPreviewQR,
  onToggleStatus,
  onDelete,
  onManagePhoto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredMembers = members.filter((member) => {
    // 1. Name search
    if (searchTerm.trim() && !member.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
      return false;
    }

    // 2. Department
    if (selectedDept !== 'all' && member.department !== selectedDept) {
      return false;
    }

    // 3. Year
    if (selectedYear !== 'all' && member.year !== selectedYear) {
      return false;
    }

    // 4. Position / Team
    if (selectedRole !== 'all') {
      const pos = member.position || member.role || '';
      if (pos.toLowerCase() !== selectedRole.toLowerCase()) {
        return false;
      }
    }

    // 5. Status
    if (selectedStatus !== 'all' && member.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDept('all');
    setSelectedYear('all');
    setSelectedRole('all');
    setSelectedStatus('all');
  };

  const departments = Array.from(new Set(members.map((m) => m.department)));
  const years = Array.from(new Set(members.map((m) => m.year)));
  const availablePositions = Array.from(
    new Set([...storageService.getPositions(), ...members.map((m) => m.position || m.role)].filter(Boolean))
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Search & Filter Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#0f2942]" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              Filter & Search Members
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Search by Name, Dept, Year, Role & Status only</span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Name Query */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Student Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Position / Team */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Position / Team
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Positions & Teams</option>
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Found <strong>{filteredMembers.length}</strong> matching members out of {members.length}
          </span>
          <span className="text-amber-700 font-medium">
            Strict compliance: No roll number or ID search available
          </span>
        </div>
      </div>

      {/* Results Table */}
      <StudentTable
        members={filteredMembers}
        onView={onView}
        onEdit={onEdit}
        onPreviewQR={onPreviewQR}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        onManagePhoto={onManagePhoto}
      />
    </div>
  );
};
