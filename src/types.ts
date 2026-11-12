export type MemberRole = 'PRESIDENT' | 'VICE-PRESIDENT' | 'EVENT MANAGEMENT TEAM' | 'DESIGINING TEAM' | 'INOVATION TEAM' | 'TECHNICAL TEAM' | 'Volunteer' | string;

export const DEFAULT_POSITIONS = [
  'President',
  'Vice-President',
  'Core Team',
  'Coordinator',
  'Technical Team',
  'Event Management Team',
  'Designing Team',
  'Innovation Team',
  'Volunteer',
];

export const MEMBER_ROLES: string[] = DEFAULT_POSITIONS;

export type MemberStatus = 'Active' | 'Inactive';

export interface Member {
  // CRITICAL: NO UHV ID, NO Roll Number, NO Student ID, NO Registration Number!
  firestoreDocId?: string; // Exact Firestore document identifier for Cloud Firestore operations
  id?: string;
  name: string;
  studentName?: string; // Standardized certificate student name
  certificateTitle?: string; // E.g., 'Universal Human Values Cell Digital Member Certificate'
  certificateNumber?: string; // Permanent certificate identifier (e.g., UHV-2026-XXXX)
  qrId?: string; // Permanent QR verification identifier (aliases qrToken)
  issueDate?: string; // Certificate issue date
  department: string;
  year: string;
  section: string;
  role: string;
  position?: string; // Official Position / Team in UHV Cell
  academicYear: string;
  joiningDate: string;
  status: MemberStatus;
  photoUrl?: string;
  email?: string;
  bloodGroup?: string;
  displayOrder?: number; // Manual display sequence number within the team (1, 2, 3...)
  qrToken: string; // Secure random internal token / qrId for public verification
  createdAt: string;
  updatedAt: string;
}

export interface MemberFormData {
  name: string;
  studentName?: string;
  certificateTitle?: string;
  certificateNumber?: string;
  qrId?: string;
  issueDate?: string;
  department: string;
  year: string;
  section: string;
  role?: string;
  position: string; // Official Position / Team
  academicYear: string;
  joiningDate: string;
  status: MemberStatus;
  photoUrl?: string;
  email?: string;
  bloodGroup?: string;
  displayOrder?: number;
}

export interface AnonymousFeedback {
  id: string;
  category: 'Workshop' | 'Peer Harmony' | 'Self Exploration' | 'Cell Activity' | 'General';
  rating: number; // 1 to 5
  message: string;
  createdAt: string;
  workshopTopic?: string;
}

export interface ValueProgressRecord {
  id: string;
  moduleName: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  completionRate: number; // 0 - 100
  targetGroup: string;
  participantsCount: number;
}

// ----------------------------------------------------
// WEBSITE MANAGEMENT & SUPER ADMIN CONFIGURATION TYPES
// ----------------------------------------------------

export interface BrandingSettings {
  websiteTitle: string;
  institutionName: string;
  institutionSubtitle: string;
  tagline: string;
  headerSlogan: string;
  customLogoUrl: string | null;
  faviconUrl: string | null;
}

export interface CustomStatItem {
  id: string;
  label: string;
  value: string;
  subtext?: string;
}

export interface HeroSettings {
  badgeText: string;
  title: string;
  subtitle: string;
  quote: string;
  subQuote: string;
  description: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  showStatsBar: boolean;
  customStats: CustomStatItem[];
}

export interface CoreValueItem {
  id: string;
  name: string;
  englishMeaning: string;
  description: string;
  category: 'Foundational' | 'Complete' | 'Operational';
  iconName: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  content: string;
  badge: 'New' | 'Important' | 'Notice' | 'Workshop';
  isPublished: boolean;
  linkUrl?: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  speaker?: string;
  description: string;
  registrationUrl?: string;
  isUpcoming: boolean;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  department: string;
  photoUrl?: string;
  message?: string;
}

export interface AboutSettings {
  vision: string;
  mission: string;
  objectives: string[];
  aicteGuidelines: string;
  leadership: CommitteeMember[];
}

export interface ContactSettings {
  email: string;
  phone: string;
  location: string;
  workingHours: string;
  mapEmbedUrl?: string;
  socialLinks: {
    youtube?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    telegram?: string;
  };
}

export interface FooterQuickLink {
  id: string;
  label: string;
  url: string;
}

export interface FooterSettings {
  aboutSummary: string;
  copyrightText: string;
  disclaimer: string;
  motto: string;
  quickLinks: FooterQuickLink[];
}

export interface AppearanceSettings {
  primaryColor: string; // Hex e.g. #0f2942
  accentColor: string;  // Hex e.g. #f59e0b
  themePreset: 'classic-navy' | 'deep-emerald' | 'royal-blue' | 'heritage-maroon';
  fontStyle: 'academic-serif' | 'clean-sans' | 'modern-hybrid';
  topBannerEnabled: boolean;
  topBannerText: string;
  topBannerBadge: string;
  topBannerLink?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Content Editor' | 'Coordinator';
  status: 'Active' | 'Suspended';
  lastLogin?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  adminName: string;
  adminRole: string;
  action: string;
  target: string;
  timestamp: string;
  category: 'Branding' | 'Homepage' | 'About' | 'Members' | 'QR' | 'Appearance' | 'Security' | 'Settings';
  details?: string;
  performedBy?: string;
}

export interface WebsiteConfig {
  branding: BrandingSettings;
  hero: HeroSettings;
  values: CoreValueItem[];
  announcements: AnnouncementItem[];
  events: EventItem[];
  about: AboutSettings;
  contact: ContactSettings;
  footer: FooterSettings;
  appearance: AppearanceSettings;
  defaultAcademicYear: string;
}

export interface AppSettings {
  institutionName: string;
  cellTitle: string;
  tagline: string;
  heroQuote: string;
  customLogoUrl: string | null;
  defaultAcademicYear: string;
  adminEmail: string;
}
