import React, { useState, useEffect } from 'react';
import { Member, MemberFormData, WebsiteConfig } from '../../types';
import { storageService } from '../../services/storage';
import { firebaseAuthService } from '../../services/firebase';
import { StudentTable } from './StudentTable';
import { StudentForm } from './StudentForm';
import { QRManagement } from './QRManagement';
import { SearchMembers } from './SearchMembers';
import { BulkImportModal } from './BulkImportModal';
import { QRPreviewModal } from './QRPreviewModal';
import { DeleteStudentModal } from './DeleteStudentModal';
import { ManagePositionsModal } from './ManagePositionsModal';
import { ManageOrderModal } from './ManageOrderModal';
import { StudentPhotoModal } from './StudentPhotoModal';
import { SuperAdminWorkflowBar } from './SuperAdmin/SuperAdminWorkflowBar';
import { BrandingTab } from './SuperAdmin/BrandingTab';
import { HomepageTab } from './SuperAdmin/HomepageTab';
import { AboutTab } from './SuperAdmin/AboutTab';
import { ContactSocialTab } from './SuperAdmin/ContactSocialTab';
import { FooterTab } from './SuperAdmin/FooterTab';
import { AppearanceTab } from './SuperAdmin/AppearanceTab';
import { AdminUsersTab } from './SuperAdmin/AdminUsersTab';
import { ActivityLogsTab } from './SuperAdmin/ActivityLogsTab';
import { BackupExportTab } from './SuperAdmin/BackupExportTab';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  QrCode,
  Search,
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Award,
  LogOut,
  Palette,
  Globe,
  Home as HomeIcon,
  BookOpen,
  Mail,
  Share2,
  Layout,
  Database,
  History,
  Shield,
  ArrowUpDown,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onViewProfile: (token: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onViewProfile,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'members'
    | 'add'
    | 'edit'
    | 'qr'
    | 'search'
    | 'branding'
    | 'homepage'
    | 'about'
    | 'contact'
    | 'footer'
    | 'appearance'
    | 'admins'
    | 'logs'
    | 'backup'
    | 'feedback'
  >('dashboard');

  const [members, setMembers] = useState<Member[]>(() => storageService.getMembers());
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [previewMember, setPreviewMember] = useState<Member | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPositionsModalOpen, setIsPositionsModalOpen] = useState(false);
  const [isManageOrderOpen, setIsManageOrderOpen] = useState(false);

  // Deletion Modal state & feedback
  const [studentToDelete, setStudentToDelete] = useState<Member | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteToast, setDeleteToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Photo Re-upload / Replace Modal state
  const [photoModalMember, setPhotoModalMember] = useState<Member | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Super Admin CMS Draft vs Published State
  const [draftConfig, setDraftConfig] = useState<WebsiteConfig>(() => storageService.getDraftConfig());
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState<boolean>(() =>
    storageService.hasUnpublishedChanges()
  );
  const [previewDraftMode, setPreviewDraftMode] = useState(false);

  // Automatically sync with Cloud Firestore and listen for reactive updates
  useEffect(() => {
    // Purge any residual AI/mock student data from localStorage immediately
    storageService.purgeAiMockData();
    storageService.syncWithCloudFirestore().catch(() => {});

    const handleStudentsUpdated = (e: Event) => {
      const custom = e as CustomEvent<Member[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setMembers(custom.detail);
      } else {
        setMembers(storageService.getMembers());
      }
    };

    window.addEventListener('uhv_students_updated', handleStudentsUpdated);
    return () => {
      window.removeEventListener('uhv_students_updated', handleStudentsUpdated);
    };
  }, []);

  const handleOpenPhotoModal = (member: Member) => {
    setPhotoModalMember(member);
    setIsPhotoModalOpen(true);
  };

  const refreshData = () => {
    setMembers(storageService.getMembers());
    setDraftConfig(storageService.getDraftConfig());
    setHasUnpublishedChanges(storageService.hasUnpublishedChanges());
  };

  const handleConfigChange = (updated: WebsiteConfig) => {
    setDraftConfig(updated);
    storageService.saveDraftConfig(updated);
    setHasUnpublishedChanges(storageService.hasUnpublishedChanges());
  };

  const handlePublish = () => {
    storageService.saveDraftConfig(draftConfig);
    storageService.publishDraftConfig();
    setHasUnpublishedChanges(false);
    alert('Website configuration successfully published live to all visitors!');
  };

  const handleSaveDraft = () => {
    storageService.saveDraftConfig(draftConfig);
    setHasUnpublishedChanges(storageService.hasUnpublishedChanges());
    alert('Draft changes successfully saved.');
  };

  const handleDiscard = () => {
    if (
      window.confirm(
        'Are you sure you want to discard your draft modifications and revert to the published live version?'
      )
    ) {
      storageService.discardDraftConfig();
      setDraftConfig(storageService.getDraftConfig());
      setHasUnpublishedChanges(false);
    }
  };

  const stats = storageService.getStats();

  const handleAddStudent = async (data: MemberFormData) => {
    try {
      const newStudent = await storageService.addMemberAsync(data);
      refreshData();
      setPreviewMember(newStudent);
      setActiveTab('members');
    } catch (err: unknown) {
      console.error('[Admin] Error creating member certificate:', err);
      const newStudent = storageService.addMember(data);
      refreshData();
      setPreviewMember(newStudent);
      setActiveTab('members');
    }
  };

  const handleEditStudent = (data: MemberFormData, shouldRegenToken?: boolean) => {
    if (!editingMember) return;
    storageService.updateMember(editingMember.qrToken, data);
    if (shouldRegenToken) {
      storageService.regenerateToken(editingMember.qrToken);
    }
    refreshData();
    setEditingMember(null);
    setActiveTab('members');
  };

  const handleToggleStatus = (member: Member) => {
    if (member.status === 'Active') {
      storageService.deactivateMember(member.qrToken);
    } else {
      storageService.reactivateMember(member.qrToken);
    }
    refreshData();
  };

  const handleDeleteMember = (member: Member) => {
    setStudentToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleStudentDeleted = (deletedStudent: Member) => {
    // Immediately remove from React state to avoid requiring reload
    setMembers((prev) => prev.filter((m) => m.qrToken !== deletedStudent.qrToken));
    refreshData();
    setDeleteToast({
      type: 'success',
      message: `Student "${deletedStudent.name}" deleted successfully.`,
    });
    setTimeout(() => {
      setDeleteToast(null);
    }, 4500);
  };

  const handleRegenerateToken = (oldToken: string) => {
    const res = storageService.regenerateToken(oldToken);
    refreshData();
    if (res.member) {
      setPreviewMember(res.member);
      alert('Secure QR token was regenerated successfully. Previous QR cards will no longer verify.');
    }
  };

  const feedbacks = storageService.getFeedbacks();
  const progressRecords = storageService.getProgressRecords();

  const isCmsTab = [
    'branding',
    'homepage',
    'about',
    'contact',
    'footer',
    'appearance',
    'admins',
    'logs',
    'backup',
  ].includes(activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Super Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f2942] text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            Super Admin Console • Website Management System
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            {draftConfig.branding.websiteTitle || 'UHV CELL – NBKRIST'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Full governance of institutional branding, website copy, student credentials, and privacy-compliant QR tokens.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Local Storage: Active</span>
          </div>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            CSV Import
          </button>

          <button
            onClick={() => setIsPositionsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Manage Teams
          </button>

          <button
            onClick={() => setIsManageOrderOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-amber-600" />
            Manage Order
          </button>

          <button
            onClick={() => {
              setEditingMember(null);
              setActiveTab('add');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#163a5e] text-white text-xs font-bold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            Add Member
          </button>

          <button
            onClick={async () => {
              await firebaseAuthService.logout().catch(() => {});
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Global Draft vs Published Workflow Status Bar */}
      <SuperAdminWorkflowBar
        hasChanges={hasUnpublishedChanges}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onDiscard={handleDiscard}
        previewMode={previewDraftMode}
        onTogglePreview={(enabled) => setPreviewDraftMode(enabled)}
      />

      {/* Action Notification Toast */}
      {deleteToast && (
        <div
          id="admin-dashboard-toast"
          className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{deleteToast.message}</span>
          </div>
          <button
            onClick={() => setDeleteToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="mb-6 space-y-2">
        {/* Core Operational Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1 shrink-0">
            Core Ops:
          </span>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'members'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Students / Members ({members.length})
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'qr'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Management
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'search'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'feedback'
                ? 'bg-[#0f2942] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedback
          </button>
        </div>

        {/* Website CMS Management Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <span className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mr-1 shrink-0">
            Website CMS:
          </span>

          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'branding'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Branding
          </button>

          <button
            onClick={() => setActiveTab('homepage')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'homepage'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            Homepage
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'about'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            About UHV Cell
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'contact'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Contact & Social
          </button>

          <button
            onClick={() => setActiveTab('footer')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'footer'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Footer
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'appearance'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Appearance
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'admins'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Users
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'logs'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Activity Logs
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'backup'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Backup / Export
          </button>
        </div>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Quick Metrics */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Membership Overview & Roster Statistics
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Members</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
                <span className="text-[10px] text-slate-400">All registered</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase">Active Members</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</div>
                <span className="text-[10px] text-emerald-600">Verified status</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-amber-800 uppercase">President</span>
                <div className="text-2xl font-bold text-amber-700 mt-1">{stats.president}</div>
                <span className="text-[10px] text-amber-600">Lead executive</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-purple-800 uppercase">Vice-President</span>
                <div className="text-2xl font-bold text-purple-700 mt-1">{stats.vicePresident}</div>
                <span className="text-[10px] text-purple-600">Executive board</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-800 uppercase">Event Management</span>
                <div className="text-2xl font-bold text-rose-700 mt-1">{stats.eventManagement}</div>
                <span className="text-[10px] text-rose-600">Programs & workshops</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-blue-800 uppercase">Technical Team</span>
                <div className="text-2xl font-bold text-blue-700 mt-1">{stats.technicalTeam}</div>
                <span className="text-[10px] text-blue-600">Systems & IT</span>
              </div>

              <div className="p-4 rounded-2xl bg-fuchsia-50/70 border border-fuchsia-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-fuchsia-800 uppercase">Designing Team</span>
                <div className="text-2xl font-bold text-fuchsia-700 mt-1">{stats.designingTeam}</div>
                <span className="text-[10px] text-fuchsia-600">Creative & visual</span>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-teal-800 uppercase">Innovation Team</span>
                <div className="text-2xl font-bold text-teal-700 mt-1">{stats.innovationTeam}</div>
                <span className="text-[10px] text-teal-600">Ideas & outreach</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-700 uppercase">Volunteers</span>
                <div className="text-2xl font-bold text-slate-800 mt-1">{stats.volunteers}</div>
                <span className="text-[10px] text-slate-500">Student pillars</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-600 uppercase">Inactive</span>
                <div className="text-2xl font-bold text-slate-600 mt-1">{stats.inactive}</div>
                <span className="text-[10px] text-slate-500">Pending review</span>
              </div>
            </div>
          </div>

          {/* Super Admin Quick Launch Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => setActiveTab('branding')}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Institutional Branding</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload official emblem, customize college name, tagline, and verification mottos.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-700 mt-4 inline-block">
                Configure Branding →
              </span>
            </div>

            <div
              onClick={() => setActiveTab('homepage')}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                  <HomeIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Homepage & Notice Board</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Publish workshop announcements, upcoming seminars, and 9 Relationship Values.
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-700 mt-4 inline-block">
                Edit Homepage Content →
              </span>
            </div>

            <div
              onClick={() => setActiveTab('qr')}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">QR Generation & Tokens</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bulk download QR cards, print sheets, regenerate secure tokens with Zero ID guarantee.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 mt-4 inline-block">
                Manage QR Credentials →
              </span>
            </div>
          </div>

          {/* Privacy & Zero ID Assurance Card */}
          <div className="p-6 rounded-2xl bg-[#0f2942] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                <ShieldCheck className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-white">
                  Zero Student ID Privacy Enforcement Standard
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                  Compliant with NBKRIST privacy rules: Student Roll Numbers and Government IDs are strictly barred. All verification paths rely solely on hidden cryptographic tokens.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-400/30">
                ZERO-ID ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Students / Members Table */}
      {activeTab === 'members' && (
        <StudentTable
          members={members}
          onView={(m) => onViewProfile(m.qrToken)}
          onEdit={(m) => {
            setEditingMember(m);
            setActiveTab('edit');
          }}
          onDelete={handleDeleteMember}
          onToggleStatus={handleToggleStatus}
          onPreviewQR={(m) => setPreviewMember(m)}
          onManagePhoto={handleOpenPhotoModal}
          onManageOrder={() => setIsManageOrderOpen(true)}
        />
      )}

      {/* Tab 3: Add Student */}
      {activeTab === 'add' && (
        <StudentForm
          onSave={handleAddStudent}
          onCancel={() => setActiveTab('members')}
        />
      )}

      {/* Tab 4: Edit Student */}
      {activeTab === 'edit' && editingMember && (
        <StudentForm
          initialData={editingMember}
          isEditing={true}
          onSave={handleEditStudent}
          onCancel={() => {
            setEditingMember(null);
            setActiveTab('members');
          }}
        />
      )}

      {/* Tab 5: QR Management */}
      {activeTab === 'qr' && (
        <QRManagement
          members={members}
          onPreviewMemberQR={(m: Member) => setPreviewMember(m)}
          onRegenerateToken={handleRegenerateToken}
        />
      )}

      {/* Tab 6: Search Members */}
      {activeTab === 'search' && (
        <SearchMembers
          members={members}
          onView={(m) => onViewProfile(m.qrToken)}
          onEdit={(m) => {
            setEditingMember(m);
            setActiveTab('edit');
          }}
          onDelete={handleDeleteMember}
          onToggleStatus={handleToggleStatus}
          onPreviewQR={(m) => setPreviewMember(m)}
          onManagePhoto={handleOpenPhotoModal}
        />
      )}

      {/* Tab 7: Feedback & Progress Records */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0f2942]" />
              Student Feedback Submissions ({feedbacks.length})
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Anonymous reflections received from campus induction and self-exploration workshops.
            </p>

            <div className="space-y-4">
              {feedbacks.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0f2942] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {item.workshopTopic && (
                    <div className="text-xs font-medium text-amber-800 mb-1">
                      Topic: {item.workshopTopic}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-slate-800 italic">
                    &ldquo;{item.message}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0f2942]" />
              Institutional Progress Milestones
            </h3>
            <div className="space-y-4 mt-4">
              {progressRecords.map((prog) => (
                <div key={prog.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-slate-900">{prog.moduleName}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {prog.completionRate}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {prog.targetGroup} • {prog.participantsCount} participants
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0f2942] rounded-full"
                      style={{ width: `${prog.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN CMS TABS */}
      {activeTab === 'branding' && (
        <BrandingTab config={draftConfig} onChange={handleConfigChange} />
      )}

      {activeTab === 'homepage' && (
        <HomepageTab config={draftConfig} onChange={handleConfigChange} />
      )}

      {activeTab === 'about' && (
        <AboutTab config={draftConfig} onChange={handleConfigChange} />
      )}

      {activeTab === 'contact' && (
        <ContactSocialTab config={draftConfig} onChange={handleConfigChange} />
      )}

      {activeTab === 'footer' && (
        <FooterTab config={draftConfig} onChange={handleConfigChange} />
      )}

      {activeTab === 'appearance' && (
        <AppearanceTab config={draftConfig} onChange={handleConfigChange} />
      )}

      {activeTab === 'admins' && <AdminUsersTab />}

      {activeTab === 'logs' && <ActivityLogsTab />}

      {activeTab === 'backup' && <BackupExportTab />}

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={() => {
          refreshData();
          setIsBulkImportOpen(false);
          setActiveTab('members');
        }}
      />

      {/* QR Preview & Card Modal */}
      <QRPreviewModal
        member={previewMember}
        isOpen={!!previewMember}
        onClose={() => setPreviewMember(null)}
        onRegenerateToken={handleRegenerateToken}
        onViewProfile={onViewProfile}
      />

      {/* Delete Student Confirmation & Execution Modal */}
      <DeleteStudentModal
        student={studentToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        onSuccess={handleStudentDeleted}
      />

      {/* Positions & Teams Governance Modal */}
      <ManagePositionsModal
        isOpen={isPositionsModalOpen}
        onClose={() => setIsPositionsModalOpen(false)}
        members={members}
        onPositionsChanged={refreshData}
      />

      {/* Manual Member Display Order Modal */}
      <ManageOrderModal
        isOpen={isManageOrderOpen}
        onClose={() => setIsManageOrderOpen(false)}
        members={members}
        onOrderUpdated={refreshData}
      />

      {/* Member Photo Management / Re-upload Modal */}
      <StudentPhotoModal
        isOpen={isPhotoModalOpen}
        member={photoModalMember}
        onClose={() => {
          setIsPhotoModalOpen(false);
          setPhotoModalMember(null);
        }}
        onPhotoUpdated={(updatedMember) => {
          setMembers((prev) =>
            prev.map((m) => (m.qrToken === updatedMember.qrToken ? updatedMember : m))
          );
          refreshData();
        }}
      />
    </div>
  );
};
