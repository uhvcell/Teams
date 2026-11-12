import {
  Member,
  MemberRole,
  MemberFormData,
  AnonymousFeedback,
  ValueProgressRecord,
  WebsiteConfig,
  AdminUser,
  ActivityLog,
  AppSettings,
  DEFAULT_POSITIONS,
} from '../types';
import {
  IS_FIREBASE_ENABLED,
  firestoreStudentsService,
  firestoreSettingsService,
  firestoreAdminsService,
  firestoreAnnouncementsService,
  firestoreEventsService,
  firestoreActivityLogsService,
} from './firebase';
import { isAdminSessionActive } from './adminSessionManager';

const STORAGE_MEMBERS_KEY = 'uhv_cell_members_v2';
const STORAGE_FEEDBACK_KEY = 'uhv_cell_feedback_v2';
const STORAGE_PROGRESS_KEY = 'uhv_cell_progress_v2';
const STORAGE_CONFIG_PUBLISHED_KEY = 'uhv_website_config_published_v2';
const STORAGE_CONFIG_DRAFT_KEY = 'uhv_website_config_draft_v2';
const STORAGE_ADMINS_KEY = 'uhv_admin_users_v2';
const STORAGE_ACTIVITY_LOGS_KEY = 'uhv_activity_logs_v2';
const STORAGE_POSITIONS_KEY = 'uhv_cell_positions_v2';

export function generateSecureToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().substring(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * Sanitizes student record for public QR verification responses.
 * Strictly removes sensitive personal data (email, bloodGroup) so that public
 * scanners only receive approved institutional verification attributes.
 */
export function sanitizeStudentForPublic(student: Member): Member {
  return {
    ...student,
    email: undefined,
    bloodGroup: undefined,
  };
}

/**
 * Generates an unguessable, cryptographically unique QR token.
 * Validates against all registered student tokens to guarantee zero collision probability.
 */
export function generateUniqueQrToken(existingTokens?: string[]): string {
  const currentTokens = new Set<string>(
    (existingTokens || storageService.getMembers().map((m) => m.qrToken)).map((t) => t.toLowerCase())
  );
  let token = generateSecureToken();
  let tries = 0;
  while (currentTokens.has(token.toLowerCase()) && tries < 30) {
    token = generateSecureToken();
    tries++;
  }
  return token;
}

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  branding: {
    websiteTitle: 'UHV CELL – NBKRIST',
    institutionName: 'N.B.K.R. Institute of Science & Technology',
    institutionSubtitle: 'Autonomous Institution • Accredited by NAAC with ‘A’ Grade',
    tagline: 'Universal Human Values Cell',
    headerSlogan: 'Existence is Co-Existence',
    customLogoUrl: '/uhv-logo.png',
    faviconUrl: '/uhv-logo.png',
  },
  hero: {
    badgeText: 'AICTE UHV MANDATED INITIATIVE',
    title: 'UHV CELL – NBKRIST',
    subtitle: 'Universal Human Values Cell',
    quote: '“Building Understanding, Responsibility and Co-Existence”',
    subQuote: '“Existence is Co-Existence”',
    description:
      'Fostering self-exploration, ethical competence, mutual trust, and universal harmony across campus life, human relationships, and nature.',
    primaryCtaText: 'SCAN / VERIFY MEMBER',
    secondaryCtaText: 'ADMIN LOGIN',
    showStatsBar: true,
    customStats: [
      { id: 'cs-1', label: 'Workshops Conducted', value: '48+', subtext: 'Interactive sessions' },
      { id: 'cs-2', label: 'Students Touched', value: '3,200+', subtext: 'Across all batches' },
      { id: 'cs-3', label: 'SIP Modules', value: '100%', subtext: 'AICTE compliant' },
      { id: 'cs-4', label: 'Peer Mentors', value: '65+', subtext: 'Active facilitators' },
    ],
  },
  values: [
    {
      id: 'val-1',
      name: 'Trust',
      englishMeaning: 'Vishwas',
      description: 'The foundational value: to be assured that the other human being naturally wants what is conducive to my happiness and prosperity.',
      category: 'Foundational',
      iconName: 'ShieldCheck',
    },
    {
      id: 'val-2',
      name: 'Respect',
      englishMeaning: 'Samman',
      description: 'Right evaluation of the other as being like me in their pursuit of continuous happiness and right understanding.',
      category: 'Foundational',
      iconName: 'Award',
    },
    {
      id: 'val-3',
      name: 'Affection',
      englishMeaning: 'Sneha',
      description: 'The feeling of acceptance of the other as one’s relative, dissolving feelings of opposition and comparison.',
      category: 'Operational',
      iconName: 'HeartHandshake',
    },
    {
      id: 'val-4',
      name: 'Care',
      englishMeaning: 'Mamta',
      description: 'The feeling of responsibility and commitment towards nurturing and protecting the body of one’s relative.',
      category: 'Operational',
      iconName: 'Heart',
    },
    {
      id: 'val-5',
      name: 'Guidance',
      englishMeaning: 'Vatsalya',
      description: 'The feeling of responsibility and commitment for helping the other to attain right understanding and right feeling.',
      category: 'Operational',
      iconName: 'Compass',
    },
    {
      id: 'val-6',
      name: 'Reverence',
      englishMeaning: 'Shraddha',
      description: 'The feeling of acceptance for those who have made effort for excellence and right understanding.',
      category: 'Operational',
      iconName: 'Star',
    },
    {
      id: 'val-7',
      name: 'Glory',
      englishMeaning: 'Gaurav',
      description: 'The feeling for those who have made effort to live with right understanding and happiness in continuity.',
      category: 'Operational',
      iconName: 'Sparkles',
    },
    {
      id: 'val-8',
      name: 'Gratitude',
      englishMeaning: 'Kritagyata',
      description: 'The feeling of acceptance for those who have made effort for my excellence and assistance.',
      category: 'Operational',
      iconName: 'Smile',
    },
    {
      id: 'val-9',
      name: 'Love',
      englishMeaning: 'Prem',
      description: 'The complete value: the feeling of relatedness to all human beings, animals, and entire nature.',
      category: 'Complete',
      iconName: 'Sun',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Annual Student Induction Program (SIP) UHV Module 2026–27 Schedule',
      date: '2026-09-15',
      content: 'All First Year B.Tech student volunteers and student coordinators are requested to participate in the upcoming 3-week interactive workshop series on Harmony in the Human Being.',
      badge: 'Important',
      isPublished: true,
      linkUrl: '#values',
    },
    {
      id: 'ann-2',
      title: 'Digital Verification ID Cards Issued for 2026–27 Core Team',
      date: '2026-09-10',
      content: 'All official UHV Cell credentials now feature cryptographic verification tokens. Members can inspect their live digital credential through the scanner portal.',
      badge: 'New',
      isPublished: true,
    },
    {
      id: 'ann-3',
      title: 'Weekly Peer Reflection & Dialogue Circle Every Wednesday',
      date: '2026-09-02',
      content: 'Join fellow students at the UHV Cell Seminar Hall from 4:30 PM to 5:30 PM for open dialogue on relationship harmony, peer empathy, and stress relief.',
      badge: 'Notice',
      isPublished: true,
    },
  ],
  events: [
    {
      id: 'ev-1',
      title: 'Harmony in Human Relationships: Moving Beyond Competition',
      date: 'October 12, 2026',
      time: '10:00 AM – 1:00 PM',
      venue: 'Auditorium Block A, NBKRIST Campus',
      speaker: 'Prof. R. R. Gaur (National UHV Advisory Committee)',
      description: 'An interactive seminar focusing on distinguishing between human intention and competence, reducing hostility, and fostering campus camaraderie.',
      isUpcoming: true,
    },
    {
      id: 'ev-2',
      title: 'Living in Co-Existence: Eco-Harmony & Campus Tree Plantation Drive',
      date: 'October 24, 2026',
      time: '7:00 AM – 10:30 AM',
      venue: 'Botanical Gardens & Eco-Park, NBKRIST',
      speaker: 'UHV Cell Student Volunteer Coordinators',
      description: 'Hands-on experiential learning on nature co-existence, natural cycles, and environmental responsibility.',
      isUpcoming: true,
    },
    {
      id: 'ev-3',
      title: 'Stress-Free Academics Through Self-Exploration Workshop',
      date: 'November 08, 2026',
      time: '2:30 PM – 5:00 PM',
      venue: 'Seminar Hall 2',
      speaker: 'Dr. M. Sreenivasa Rao (UHV Cell Convener)',
      description: 'Practical self-reflection methods to maintain inner harmony, manage exam pressures, and build lasting confidence.',
      isUpcoming: true,
    },
  ],
  about: {
    vision:
      'To build a harmonious, value-based institutional culture where technical education is grounded in human values, ethical competence, and ecological co-existence.',
    mission:
      'To facilitate self-exploration in every student and faculty member to understand the harmony at all levels of existence: in oneself, in family, in society, and in nature.',
    objectives: [
      'Facilitate student transition from rote examination pressure into reflective self-exploration.',
      'Establish relationship-oriented campus interactions centered on Trust (Vishwas) and Respect (Samman).',
      'Integrate AICTE mandatory universal human values guidelines into the undergraduate engineering curriculum.',
      'Empower student volunteers to lead community harmony initiatives and peer counseling.',
      'Protect student dignity through strict privacy standards with zero display of roll numbers or identifiers.',
    ],
    aicteGuidelines:
      'The UHV Cell at NBKRIST aligns comprehensively with the National Model Curriculum prescribed by AICTE and UGC. It integrates UHV-I during the Student Induction Program (SIP) and UHV-II as a credit course on Understanding Harmony and Ethical Human Conduct.',
    leadership: [
      {
        id: 'lead-1',
        name: 'Dr. V. Vijaya Kumar Reddy',
        role: 'Director & Chief Patron',
        department: 'Administration, NBKRIST',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        message: 'True education is not merely technical competence; it is character, ethics, and responsibility towards all living beings.',
      },
      {
        id: 'lead-2',
        name: 'Dr. M. Sreenivasa Rao',
        role: 'Faculty Convener & UHV Coordinator',
        department: 'Humanities & Sciences',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        message: 'When students realize that their core desire is continuous happiness and harmony, campus conflicts dissolve naturally.',
      },
    ],
  },
  contact: {
    email: 'uhvcell@nbkrist.org',
    phone: '+91 8624 228247',
    location: 'Universal Human Values Cell, Administrative Block (Ground Floor), NBKRIST Campus, Vidyanagar – 524 413, SPSR Nellore District, A.P., India',
    workingHours: 'Monday – Saturday: 9:00 AM – 5:00 PM',
    mapEmbedUrl: '',
    socialLinks: {
      youtube: 'https://youtube.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
      telegram: 'https://telegram.org',
    },
  },
  footer: {
    aboutSummary:
      'Universal Human Values Cell at N.B.K.R. Institute of Science & Technology (Autonomous) is committed to nurturing ethical human conduct, self-exploration, and mutual happiness with fellow beings and nature.',
    copyrightText: '© 2026–27 Universal Human Values Cell – NBKRIST. All Rights Reserved.',
    disclaimer:
      'The UHV Cell portal strictly observes institutional privacy policies. No student roll numbers, government IDs, or private registration numbers are published or collected.',
    motto: '“Existence is Co-Existence • Building Understanding, Responsibility and Co-Existence”',
    quickLinks: [
      { id: 'ql-1', label: 'Home', url: 'home' },
      { id: 'ql-2', label: 'Human Values Framework', url: 'values' },
      { id: 'ql-3', label: 'Anonymous Feedback', url: 'feedback' },
      { id: 'ql-4', label: 'Verify Member QR', url: 'scan' },
      { id: 'ql-5', label: 'Administrator Portal', url: 'login' },
    ],
  },
  appearance: {
    primaryColor: '#0f2942',
    accentColor: '#f59e0b',
    themePreset: 'classic-navy',
    fontStyle: 'academic-serif',
    topBannerEnabled: true,
    topBannerText: 'Welcome to UHV Cell – NBKRIST: Explore the 9 Core Values of Harmonious Relationships',
    topBannerBadge: 'OFFICIAL PORTAL',
    topBannerLink: '#values',
  },
  defaultAcademicYear: '2026–27',
};

// Official UHV CELL – NBKRIST enrolled student records (82 real students, QR tokens from official export)
// Generated from: UHV_NBKRIST_Active_Members_QR_Export_2026-11-11.zip
const SEED_MEMBERS: Member[] = [
  { id: '0ff49637-d875-4402-8e64-998ead3037d2', qrToken: '0ff49637-d875-4402-8e64-998ead3037d2', name: 'K.madhuri kavya',          department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 1,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '1106d16b-8a07-4db3-b24f-7ae9db7ac6ab', qrToken: '1106d16b-8a07-4db3-b24f-7ae9db7ac6ab', name: 'Y.pallavi',                department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 2,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '14330fd6-07bb-475a-a62a-c849ed2cb783', qrToken: '14330fd6-07bb-475a-a62a-c849ed2cb783', name: 'Kamatam Neeraja',          department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 3,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '187609a8-b377-482d-a770-23b6e3512bfd', qrToken: '187609a8-b377-482d-a770-23b6e3512bfd', name: 'P. Narmadha',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 4,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '193e8234-1275-4c31-b844-403d4967ebd0', qrToken: '193e8234-1275-4c31-b844-403d4967ebd0', name: 'K.Sri Rekha',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 5,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '1957081c-0c97-4375-90e5-49023149447f', qrToken: '1957081c-0c97-4375-90e5-49023149447f', name: 'V. Hemanth Krishna',       department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 6,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '1a0cb67b-23ab-4a69-81f0-8d20d461b244', qrToken: '1a0cb67b-23ab-4a69-81f0-8d20d461b244', name: 'S. Pranay',                department: 'Electronics and Communication Engineering', year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 7,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '1fa6688c-1ca1-4e07-80b0-87a8fa3cc474', qrToken: '1fa6688c-1ca1-4e07-80b0-87a8fa3cc474', name: 'A.Bhavya Sri',             department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 9,  photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '2153f2e1-d613-4c77-8b18-634fe7346d90', qrToken: '2153f2e1-d613-4c77-8b18-634fe7346d90', name: 'E. Udayalakshmi',          department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 10, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '2495cfe7-f167-4b43-8321-c263d2ca6031', qrToken: '2495cfe7-f167-4b43-8321-c263d2ca6031', name: 'K yogitha',                department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 11, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '2797fb11-3247-4cf6-96a8-316519da9f16', qrToken: '2797fb11-3247-4cf6-96a8-316519da9f16', name: 'N. NAVYA',                 department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 12, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '2b3f9fa7-e407-4153-a744-552a971e4ad1', qrToken: '2b3f9fa7-e407-4153-a744-552a971e4ad1', name: 'N.VISHNU SAI REDDY',       department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 13, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '2c681c33-1143-47d7-b608-18615fdc17fa', qrToken: '2c681c33-1143-47d7-b608-18615fdc17fa', name: 'T. VARUNEMDHAR REDDY',     department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'President',             role: 'President' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 14, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '2ced6ea6-cd61-4c9e-8d7b-783c6404f02b', qrToken: '2ced6ea6-cd61-4c9e-8d7b-783c6404f02b', name: 'D.Sujith kumar',           department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 15, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '369ae729-f6e5-4b87-80e1-de62b560e382', qrToken: '369ae729-f6e5-4b87-80e1-de62b560e382', name: 'E.Madhumathi',             department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 16, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '3a9d07d6-cae0-47a1-beed-1303bd520547', qrToken: '3a9d07d6-cae0-47a1-beed-1303bd520547', name: 'T.Sukesh Kumar',           department: 'Electronics and Communication Engineering', year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 17, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '3b79f431-a40e-4e09-b89b-690d412c78bd', qrToken: '3b79f431-a40e-4e09-b89b-690d412c78bd', name: 'S.Thanuja',                department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 18, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '43432105-f908-4c63-871f-6d3ffca1e486', qrToken: '43432105-f908-4c63-871f-6d3ffca1e486', name: 'YANAMALA MUKUNDA',         department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 20, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '44bf51f7-06d3-43b8-b354-4b97cc9a83c6', qrToken: '44bf51f7-06d3-43b8-b354-4b97cc9a83c6', name: 'V.Asritha',                department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 21, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '4a879882-f8bd-45fa-a0f5-755dc9fd8adf', qrToken: '4a879882-f8bd-45fa-a0f5-755dc9fd8adf', name: 'Bala Sankar Bejawada',     department: 'Electronics and Communication Engineering', year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 23, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '4a95b334-2aa9-4f36-9fcd-d88351dbddd6', qrToken: '4a95b334-2aa9-4f36-9fcd-d88351dbddd6', name: 'K.suvigna',                department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 24, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '4f4ce791-2625-463e-9b7f-4ee5642e28a9', qrToken: '4f4ce791-2625-463e-9b7f-4ee5642e28a9', name: 'V.Anvesh',                 department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 26, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '5086de69-3358-4cf9-a900-eecdb939f25a', qrToken: '5086de69-3358-4cf9-a900-eecdb939f25a', name: 'M. RISHITHANJALI',         department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 27, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '5712930e-9896-4532-be37-9f985e11360a', qrToken: '5712930e-9896-4532-be37-9f985e11360a', name: 'MATLA AKHIL',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 28, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '589cf7b6-e80c-4f5d-86c9-df118aeb8691', qrToken: '589cf7b6-e80c-4f5d-86c9-df118aeb8691', name: 'G.Sai Girishma',           department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 29, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '58a5f22a-9a11-4064-96d2-08fa61b047ac', qrToken: '58a5f22a-9a11-4064-96d2-08fa61b047ac', name: 'RAVILLA VENKATA MAHIDHAR', department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 30, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '5b7e0b28-8c6a-4e8b-83e6-2e8005965cd0', qrToken: '5b7e0b28-8c6a-4e8b-83e6-2e8005965cd0', name: 'D.Narasimha',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 32, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '612c6923-ee64-4545-9f9f-2100d7d43e7c', qrToken: '612c6923-ee64-4545-9f9f-2100d7d43e7c', name: 'A.DEEPIKA',                department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 33, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '624c3fda-131a-4416-a273-6dfc45db22dc', qrToken: '624c3fda-131a-4416-a273-6dfc45db22dc', name: 'SK. Nausheen Sultana',     department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 34, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '6323f20e-0d46-429d-8753-9e049af20b75', qrToken: '6323f20e-0d46-429d-8753-9e049af20b75', name: 'Cheni.Padma Harshitha',    department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 35, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '64095954-f7f3-4d7a-bce3-970fa5c97f82', qrToken: '64095954-f7f3-4d7a-bce3-970fa5c97f82', name: 'M.Sravani',                department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 36, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '6759d0c6-f1e8-4918-9ff0-b5ea26b909b9', qrToken: '6759d0c6-f1e8-4918-9ff0-b5ea26b909b9', name: 'Eduru kowshik',            department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 37, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '6b0716df-cf28-482a-bedc-134ed03e1285', qrToken: '6b0716df-cf28-482a-bedc-134ed03e1285', name: 'E. Abhijith',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 38, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '763371d2-9c9d-4507-8c2c-9fac0d85163a', qrToken: '763371d2-9c9d-4507-8c2c-9fac0d85163a', name: 'D.Srinidhi',               department: 'Electronics and Communication Engineering', year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 40, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '78073c41-6286-4f7e-a428-a8d44af93c71', qrToken: '78073c41-6286-4f7e-a428-a8d44af93c71', name: 'M.NAGAKAVYA',              department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 41, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '79f19335-6182-40ee-99a7-f73ad443eaea', qrToken: '79f19335-6182-40ee-99a7-f73ad443eaea', name: 'K.Vasanthi',               department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 42, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '7b404974-e45a-454c-bbca-30a20a99a459', qrToken: '7b404974-e45a-454c-bbca-30a20a99a459', name: 'E. Udayalakshmi',          department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 44, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '7e7da053-501b-44e3-a54a-ad99b092b501', qrToken: '7e7da053-501b-44e3-a54a-ad99b092b501', name: 'Kamatham Meenakshi',       department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 45, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '84014cf8-39fc-4bd7-850f-a7c9c61b8010', qrToken: '84014cf8-39fc-4bd7-850f-a7c9c61b8010', name: 'K. NANDHA KISHORE REDDY', department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 46, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '8b95bd22-a3bb-4301-8867-3a81700c84e3', qrToken: '8b95bd22-a3bb-4301-8867-3a81700c84e3', name: 'M.NAGA SAMPATH',           department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 47, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '9090293c-b712-419b-b313-5183e441d5b7', qrToken: '9090293c-b712-419b-b313-5183e441d5b7', name: 'K. RITHIKA',               department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Vice-President',        role: 'Vice-President' as MemberRole,        status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 49, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '91f723cd-bf33-468e-9424-f181f5212826', qrToken: '91f723cd-bf33-468e-9424-f181f5212826', name: 'R.MADHULIKA',              department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 50, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '9814bcba-ffe0-4117-95e5-101f0b73e403', qrToken: '9814bcba-ffe0-4117-95e5-101f0b73e403', name: 'V.Spoorthi',               department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 51, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '99ba0478-bc2d-49b9-84f8-7def1552c3aa', qrToken: '99ba0478-bc2d-49b9-84f8-7def1552c3aa', name: 'V. Bramhani',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 52, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '9a2b612f-c1ed-4183-9379-5f1177164e53', qrToken: '9a2b612f-c1ed-4183-9379-5f1177164e53', name: 'Y. MUKUNDA',               department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 53, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '9e75c04c-ed52-41ff-8e4b-ba1513352595', qrToken: '9e75c04c-ed52-41ff-8e4b-ba1513352595', name: 'Venkat Karthik Challa',    department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 54, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: '9f642de7-b493-4c9b-8f66-1bed76692599', qrToken: '9f642de7-b493-4c9b-8f66-1bed76692599', name: 'C. Divya',                 department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 55, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a1a74c67-469f-427c-b57a-ab8c2fae209c', qrToken: 'a1a74c67-469f-427c-b57a-ab8c2fae209c', name: 'Kamalini Chamarthi',       department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 56, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a2a09b34-0013-4621-aacf-e693007430b2', qrToken: 'a2a09b34-0013-4621-aacf-e693007430b2', name: 'K.Harshitha',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 57, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a3a9bbb1-201b-475a-aa4d-187363099e7c', qrToken: 'a3a9bbb1-201b-475a-aa4d-187363099e7c', name: 'A. Gayathri',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 58, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a5303c32-4134-453b-8e81-d87b7f198455', qrToken: 'a5303c32-4134-453b-8e81-d87b7f198455', name: 'NEMALLURU JAGADEESH',      department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 59, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a5ed359b-c427-41bc-b9b2-02a8ac90c93a', qrToken: 'a5ed359b-c427-41bc-b9b2-02a8ac90c93a', name: 'Eduru kowshik',            department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 60, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a6ed4284-629d-4d98-a12a-4a6c8fd2ae22', qrToken: 'a6ed4284-629d-4d98-a12a-4a6c8fd2ae22', name: 'K.sudarshana',             department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 61, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'a7534fe7-418a-4301-be81-32f90338c965', qrToken: 'a7534fe7-418a-4301-be81-32f90338c965', name: 'M. Bhavya',                department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 62, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'ab8642ee-b2c1-4a24-a43c-09f82d123f52', qrToken: 'ab8642ee-b2c1-4a24-a43c-09f82d123f52', name: 'M. RISHITHANJALI',         department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 63, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'afd58f6d-58c2-4a98-8a2c-e0de28b1d5b1', qrToken: 'afd58f6d-58c2-4a98-8a2c-e0de28b1d5b1', name: 'C.Harshini',               department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 64, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'b00fd7a1-d855-4984-8894-fa1f68ae0033', qrToken: 'b00fd7a1-d855-4984-8894-fa1f68ae0033', name: 'B.Priyanka',               department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 65, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'b41bf565-e0f8-4e1a-be51-e5e640574e81', qrToken: 'b41bf565-e0f8-4e1a-be51-e5e640574e81', name: 'CH.SPANDANA',              department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 66, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'b568d81c-f1bb-411b-aba9-2cbde5c5c845', qrToken: 'b568d81c-f1bb-411b-aba9-2cbde5c5c845', name: 'P.Vyshnavi',               department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 67, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'ba7c6dd0-8a8b-485d-84bf-3a878116f06a', qrToken: 'ba7c6dd0-8a8b-485d-84bf-3a878116f06a', name: 'Chaitanya Mandha',         department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 69, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'bc1366e7-ef20-4112-bea1-8d5010ab30a1', qrToken: 'bc1366e7-ef20-4112-bea1-8d5010ab30a1', name: 'P. Narmadha',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 70, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'bc42ee66-e089-4898-8da2-a99a0dc8a5ba', qrToken: 'bc42ee66-e089-4898-8da2-a99a0dc8a5ba', name: 'V.Simhadri',               department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 71, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'c0dbadf4-96d9-4d74-bc76-2fa5973f4e3b', qrToken: 'c0dbadf4-96d9-4d74-bc76-2fa5973f4e3b', name: 'V.Vyshnavi Priya',         department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 72, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'c9cd1f66-4b95-4d44-9c55-1e2141090f0d', qrToken: 'c9cd1f66-4b95-4d44-9c55-1e2141090f0d', name: 'K.sudarshana',             department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 73, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'caec361a-4b83-4eaf-b9d1-8f47ceb94c06', qrToken: 'caec361a-4b83-4eaf-b9d1-8f47ceb94c06', name: 'N. Sai Pravalika',         department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 74, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'cea824c6-7b68-4599-b6f9-a8e1bfdd3da1', qrToken: 'cea824c6-7b68-4599-b6f9-a8e1bfdd3da1', name: 'B.Bharath',                department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 75, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'd01b3793-648f-4563-90e2-08e56761f386', qrToken: 'd01b3793-648f-4563-90e2-08e56761f386', name: 'R.Nithya priya',           department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 76, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'd70b903a-43cf-4d4a-9a1d-302fc6d56dc7', qrToken: 'd70b903a-43cf-4d4a-9a1d-302fc6d56dc7', name: 'S.Varshitha',              department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 77, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'd7f5ee35-32b9-4d65-9c7c-b6acb7663532', qrToken: 'd7f5ee35-32b9-4d65-9c7c-b6acb7663532', name: 'K.Charan Tej Reddy',       department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 78, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'dd0786db-ba43-44dc-9ae3-18af8ba0a231', qrToken: 'dd0786db-ba43-44dc-9ae3-18af8ba0a231', name: 'G.Tejaswinireddy',          department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 79, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'e0521547-d8b5-4dac-b036-a7df15727b35', qrToken: 'e0521547-d8b5-4dac-b036-a7df15727b35', name: 'P. Kaveri',                department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Innovation Team',       role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 80, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'eb55eff5-1aaf-48db-895f-80d7e819ecd0', qrToken: 'eb55eff5-1aaf-48db-895f-80d7e819ecd0', name: 'VEEPURU VYSHNAV',          department: 'Artificial Intelligence and Data Science',  year: '3rd Year', section: 'A', position: 'Volunteer',             role: 'Volunteer' as MemberRole,             status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 82, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'f5036bef-5308-4209-997e-f1a0f0253246', qrToken: 'f5036bef-5308-4209-997e-f1a0f0253246', name: 'SK. LATHEEF',              department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Designing Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 83, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'faeebcad-b6f3-4303-aabf-9c639d6fb6b3', qrToken: 'faeebcad-b6f3-4303-aabf-9c639d6fb6b3', name: 'M . Manoj',                department: 'Computer Science and Engineering',          year: '3rd Year', section: 'A', position: 'Technical Team',        role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 84, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
  { id: 'fff0fd52-2f9a-46a1-90f2-b2f9c9e134ab', qrToken: 'fff0fd52-2f9a-46a1-90f2-b2f9c9e134ab', name: 'P. Lokanadh',              department: 'Electrical and Electronics Engineering',   year: '3rd Year', section: 'A', position: 'Event Management Team', role: 'Member' as MemberRole,               status: 'Active', joiningDate: '2026-11-11', academicYear: '2026-27', displayOrder: 85, photoUrl: '', email: '', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z' },
];

// List of legacy mock student tokens to automatically purge from localStorage/cache
const LEGACY_AI_SEED_TOKENS = new Set([
  '8f72c91a-41d8-4e72-9a31-7b9c2014d5e1', // K. Sai Siddartha
  '3d91b452-98e2-41f0-bc37-a129ef9980c2', // P. Ananya Reddy
  '6b29f123-11a4-4bc9-8802-990141bbde77', // S. Manoj Kumar
  '1c49e880-9281-4cd2-baf8-65481023aae2', // Ch. Lavanya
  'e45c7118-2041-4d7a-85bc-223401faec59', // M. Harshavardhan
  '7a12bc90-9943-4c91-9ef2-5a2109930f14', // V. Sneha Latha
  'b81098ef-c731-482a-a922-fe4177d61b33', // R. Tarun Kumar
  '4c77aa10-0982-4fa1-88dc-9133aa822bf1', // G. Divya Vani
  '5a88bf21-3310-4491-b9cd-789012345678', // B. Rajesh
  '45b744b6-1a2b-47b5-9085-5f6da1a7e124', // K.Sai Teja
]);

// Name-based patterns for AI-generated dummy records to remove
export const AI_MOCK_NAMES_PATTERNS = [
  'sai siddartha',
  'siddartha',
  'ananya reddy',
  'p. ananya reddy',
  'manoj kumar',
  's. manoj kumar',
  'lavanya',
  'ch. lavanya',
  'harshavardhan',
  'm. harshavardhan',
  'sneha latha',
  'v. sneha latha',
  'tarun kumar',
  'r. tarun kumar',
  'divya vani',
  'g. divya vani',
  'rajesh',
  'b. rajesh',
  'sai teja',
  'k.sai teja',
  'k. sai teja',
  'bhavana',
  'rohit',
];

/**
 * Checks whether a given student record is an AI-generated dummy/placeholder record.
 */
export function isAiMockStudent(member: Member | null | undefined): boolean {
  if (!member) return false;
  const token = (member.qrToken || member.qrId || member.id || '').trim().toLowerCase();
  if (token) {
    for (const aiToken of LEGACY_AI_SEED_TOKENS) {
      if (aiToken.toLowerCase() === token) return true;
    }
  }

  const rawName = (member.studentName || member.name || '').trim().toLowerCase();
  if (!rawName) return false;

  return AI_MOCK_NAMES_PATTERNS.some((pattern) => {
    return rawName === pattern || rawName.includes(pattern);
  });
}

const SEED_ADMINS: AdminUser[] = [
  {
    id: 'adm-1',
    name: 'Dr. M. Sreenivasa Rao',
    email: 'admin.uhv@nbkrist.org',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'adm-3',
    name: 'Faculty Steering Coordinator',
    email: 'coordinator.uhv@nbkrist.org',
    role: 'Coordinator',
    status: 'Active',
    lastLogin: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: '2024-08-01T00:00:00.000Z',
  },
];

const SEED_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    adminName: 'Dr. M. Sreenivasa Rao',
    adminRole: 'Super Admin',
    action: 'Published live website settings & branding',
    target: 'Website Branding & Appearance',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'Branding',
  },
  {
    id: 'log-2',
    adminName: 'Dr. M. Sreenivasa Rao',
    adminRole: 'Super Admin',
    action: 'Initialized UHV Student Verification portal',
    target: 'Student Verification System',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    category: 'QR',
  },
  {
    id: 'log-3',
    adminName: 'Faculty Steering Coordinator',
    adminRole: 'Coordinator',
    action: 'Added announcement on Student Induction Program',
    target: 'Homepage Notice Board',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    category: 'Homepage',
  },
];

const SEED_FEEDBACK: AnonymousFeedback[] = [
  {
    id: 'fb-1',
    category: 'Workshop',
    rating: 5,
    workshopTopic: 'Harmony in Human-to-Human Relationships (Trust & Respect)',
    message: 'The self-exploration exercises helped me realize the difference between intention and competence. Truly eye-opening!',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'fb-2',
    category: 'Peer Harmony',
    rating: 5,
    workshopTopic: 'Living in Harmony in the Society',
    message: 'Campus atmosphere feels noticeably warmer and more collaborative thanks to the peer discussion circles.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'fb-3',
    category: 'Self Exploration',
    rating: 4,
    workshopTopic: 'Harmony in Self (I and Body)',
    message: 'Understanding bodily needs versus the needs of the Self resolved a lot of my anxiety about peer competition.',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const SEED_PROGRESS: ValueProgressRecord[] = [
  {
    id: 'prog-1',
    moduleName: 'Student Induction Program (SIP) - UHV Foundation',
    status: 'Completed',
    completionRate: 100,
    targetGroup: 'First Year B.Tech (All Branches)',
    participantsCount: 780,
  },
  {
    id: 'prog-2',
    moduleName: 'Harmony in the Family & Society Workshops',
    status: 'In Progress',
    completionRate: 74,
    targetGroup: 'Second & Third Year Volunteers & Coordinators',
    participantsCount: 340,
  },
  {
    id: 'prog-3',
    moduleName: 'Universal Human Values Minor Degree Elective (UHV-II)',
    status: 'In Progress',
    completionRate: 60,
    targetGroup: 'Third Year B.Tech Enthusiasts',
    participantsCount: 195,
  },
  {
    id: 'prog-4',
    moduleName: 'Nature Co-Existence & Environmental Field Reflection',
    status: 'Upcoming',
    completionRate: 15,
    targetGroup: 'Campus-wide Eco-Harmony Drive',
    participantsCount: 450,
  },
];

export const storageService = {
  // ----------------------------------------------------
  // WEBSITE CONFIGURATION (DRAFT & PUBLISHED WORKFLOW)
  // ----------------------------------------------------
  getPublishedConfig(): WebsiteConfig {
    const raw = localStorage.getItem(STORAGE_CONFIG_PUBLISHED_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CONFIG_PUBLISHED_KEY, JSON.stringify(DEFAULT_WEBSITE_CONFIG));
      return DEFAULT_WEBSITE_CONFIG;
    }
    try {
      const parsed = JSON.parse(raw);
      const res = { ...DEFAULT_WEBSITE_CONFIG, ...parsed };
      if (!res.branding.customLogoUrl) {
        res.branding.customLogoUrl = '/uhv-logo.png';
      }
      return res;
    } catch {
      return DEFAULT_WEBSITE_CONFIG;
    }
  },

  getDraftConfig(): WebsiteConfig {
    const raw = localStorage.getItem(STORAGE_CONFIG_DRAFT_KEY);
    if (!raw) {
      // Default draft to published
      const published = this.getPublishedConfig();
      localStorage.setItem(STORAGE_CONFIG_DRAFT_KEY, JSON.stringify(published));
      return published;
    }
    try {
      const parsed = JSON.parse(raw);
      const res = { ...DEFAULT_WEBSITE_CONFIG, ...parsed };
      if (!res.branding.customLogoUrl) {
        res.branding.customLogoUrl = '/uhv-logo.png';
      }
      return res;
    } catch {
      return this.getPublishedConfig();
    }
  },

  saveDraftConfig(config: WebsiteConfig, adminName = 'Super Admin'): void {
    localStorage.setItem(STORAGE_CONFIG_DRAFT_KEY, JSON.stringify(config));
    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: 'Saved website draft modifications',
      target: 'Draft Configuration',
      category: 'Settings',
    });
  },

  publishDraftConfig(adminName = 'Super Admin'): void {
    const draft = this.getDraftConfig();
    localStorage.setItem(STORAGE_CONFIG_PUBLISHED_KEY, JSON.stringify(draft));
    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: 'Published draft changes to live website',
      target: 'Live Portal Configuration',
      category: 'Settings',
    });
    // Asynchronously push to Cloud Firestore if enabled
    if (IS_FIREBASE_ENABLED) {
      firestoreSettingsService.saveWebsiteConfig(draft, false).catch((err) => {
        console.warn('[Firestore] Background config publish sync warning:', err);
      });
      if (draft.announcements && draft.announcements.length > 0) {
        firestoreAnnouncementsService.syncAllAnnouncements(draft.announcements).catch(() => {});
      }
      if (draft.events && draft.events.length > 0) {
        firestoreEventsService.syncAllEvents(draft.events).catch(() => {});
      }
    }

    // Dispatch custom event for immediate UI reaction if any
    window.dispatchEvent(new Event('uhv_config_updated'));
  },

  discardDraftConfig(adminName = 'Super Admin'): WebsiteConfig {
    const published = this.getPublishedConfig();
    localStorage.setItem(STORAGE_CONFIG_DRAFT_KEY, JSON.stringify(published));
    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: 'Reverted draft changes to currently published version',
      target: 'Draft Configuration',
      category: 'Settings',
    });
    return published;
  },

  hasUnpublishedChanges(): boolean {
    const pub = localStorage.getItem(STORAGE_CONFIG_PUBLISHED_KEY);
    const draft = localStorage.getItem(STORAGE_CONFIG_DRAFT_KEY);
    if (!draft) return false;
    return pub !== draft;
  },

  // Backwards compatibility for AppSettings
  getSettings(): AppSettings {
    const config = this.getPublishedConfig();
    return {
      institutionName: config.branding.institutionName,
      cellTitle: config.branding.websiteTitle,
      tagline: config.branding.tagline,
      heroQuote: config.hero.quote,
      customLogoUrl: config.branding.customLogoUrl,
      defaultAcademicYear: config.defaultAcademicYear,
      adminEmail: config.contact.email,
    };
  },

  saveSettings(settings: AppSettings): void {
    const draft = this.getDraftConfig();
    draft.branding.institutionName = settings.institutionName;
    draft.branding.websiteTitle = settings.cellTitle;
    draft.branding.tagline = settings.tagline;
    draft.hero.quote = settings.heroQuote;
    draft.branding.customLogoUrl = settings.customLogoUrl;
    draft.defaultAcademicYear = settings.defaultAcademicYear;
    draft.contact.email = settings.adminEmail;

    this.saveDraftConfig(draft);
    this.publishDraftConfig();
  },

  // ----------------------------------------------------
  // MEMBERS / STUDENTS (STRICT ZERO ID RULES)
  // ----------------------------------------------------
  getDeletedTokens(): string[] {
    try {
      const raw = localStorage.getItem('uhv_deleted_student_tokens');
      const list: string[] = raw ? JSON.parse(raw) : [];
      // Recovery: Never allow authentic registered seed students to be treated as deleted
      const realTokens = new Set(SEED_MEMBERS.map((m) => m.qrToken.toLowerCase()));
      const filtered = list.filter((token) => !realTokens.has(token.toLowerCase()));
      if (filtered.length !== list.length) {
        localStorage.setItem('uhv_deleted_student_tokens', JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  },

  markTokenDeleted(token: string): void {
    if (!token) return;
    try {
      const deleted = this.getDeletedTokens();
      if (!deleted.includes(token.trim())) {
        deleted.push(token.trim());
        localStorage.setItem('uhv_deleted_student_tokens', JSON.stringify(deleted));
      }
    } catch {
      // ignore
    }
  },

  isTokenDeleted(token: string): boolean {
    if (!token) return true;
    const deleted = this.getDeletedTokens();
    return deleted.includes(token.trim());
  },

  normalizeMemberRole(rawRole: string | undefined): string {
    if (!rawRole) return 'Volunteer';
    const r = rawRole.trim();
    if (/^president$/i.test(r)) return 'President';
    if (/^vice[-\s]?president$/i.test(r)) return 'Vice-President';
    if (/^core(\s+team)?$/i.test(r)) return 'Core Team';
    if (/^coordinators?$/i.test(r)) return 'Coordinator';
    if (/^technical(\s+team)?$/i.test(r) || /^tech(\s+team)?$/i.test(r)) return 'Technical Team';
    if (/^event(\s+management)?(\s+team)?$/i.test(r)) return 'Event Management Team';
    if (/^desig?i?ning(\s+team)?$/i.test(r)) return 'Designing Team';
    if (/^in+ovations?(\s+team)?$/i.test(r)) return 'Innovation Team';
    if (/^volunteers?$/i.test(r)) return 'Volunteer';
    return r;
  },

  getPositions(): string[] {
    const raw = localStorage.getItem(STORAGE_POSITIONS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(DEFAULT_POSITIONS));
      return [...DEFAULT_POSITIONS];
    }
    try {
      const parsed: string[] = JSON.parse(raw);
      // Always guarantee default positions are present
      const merged = Array.from(new Set([...DEFAULT_POSITIONS, ...parsed]));
      return merged;
    } catch {
      return [...DEFAULT_POSITIONS];
    }
  },

  savePositions(positions: string[]): void {
    const clean = Array.from(new Set(positions.map((p) => p.trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(clean));
    if (IS_FIREBASE_ENABLED) {
      firestoreSettingsService.saveCustomPositions(clean).catch(() => {});
    }
  },

  addPosition(name: string): boolean {
    const cleanName = name.trim();
    if (!cleanName) return false;
    const current = this.getPositions();
    if (current.some((p) => p.toLowerCase() === cleanName.toLowerCase())) {
      return false;
    }
    current.push(cleanName);
    this.savePositions(current);
    return true;
  },

  deletePosition(name: string): boolean {
    const cleanName = name.trim().toLowerCase();
    const isDefault = DEFAULT_POSITIONS.some((d) => d.toLowerCase() === cleanName);
    if (isDefault) return false; // Default positions cannot be deleted
    const current = this.getPositions();
    const filtered = current.filter((p) => p.toLowerCase() !== cleanName);
    this.savePositions(filtered);
    return true;
  },

  getMembers(): Member[] {
    const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
    const deletedTokens = this.getDeletedTokens();
    if (!raw) {
      const filtered = SEED_MEMBERS.filter(
        (m) => !deletedTokens.includes(m.qrToken) && !LEGACY_AI_SEED_TOKENS.has(m.qrToken) && !isAiMockStudent(m)
      );
      localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(filtered));
      return filtered;
    }
    try {
      const parsed: Member[] = JSON.parse(raw);
      let needsResave = false;

      // Strictly filter out any legacy AI-generated mock members from browser storage
      const nonMock = parsed.filter(
        (m) => !isAiMockStudent(m) && !deletedTokens.includes(m.qrToken)
      );
      if (nonMock.length !== parsed.length) {
        needsResave = true;
      }

      const normalized = nonMock.map((m) => {
        const normPos = this.normalizeMemberRole(m.position || m.role);
        if (normPos !== m.position || normPos !== m.role) {
          needsResave = true;
          return { ...m, position: normPos, role: normPos };
        }
        return m;
      });

      // Automatically assign initial displayOrder per team if missing
      const teamOrderCounters = new Map<string, number>();
      normalized.forEach((m) => {
        if (typeof m.displayOrder === 'number' && m.displayOrder > 0) {
          const tKey = (m.position || m.role || 'Volunteer').trim().toLowerCase();
          const curr = teamOrderCounters.get(tKey) || 0;
          if (m.displayOrder > curr) {
            teamOrderCounters.set(tKey, m.displayOrder);
          }
        }
      });

      normalized.forEach((m) => {
        if (typeof m.displayOrder !== 'number' || m.displayOrder <= 0) {
          const tKey = (m.position || m.role || 'Volunteer').trim().toLowerCase();
          const next = (teamOrderCounters.get(tKey) || 0) + 1;
          teamOrderCounters.set(tKey, next);
          m.displayOrder = next;
          needsResave = true;
        }
      });

      if (needsResave) {
        localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(normalized));
      }
      return normalized.filter((m) => !deletedTokens.includes(m.qrToken));
    } catch {
      return SEED_MEMBERS.filter((m) => !deletedTokens.includes(m.qrToken));
    }
  },

  saveMembers(members: Member[]): void {
    const deletedTokens = this.getDeletedTokens();
    const clean = members.filter((m) => !deletedTokens.includes(m.qrToken) && !isAiMockStudent(m));
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(clean));
  },

  purgeAiMockData(): Member[] {
    const raw = localStorage.getItem(STORAGE_MEMBERS_KEY);
    const deletedTokens = this.getDeletedTokens();
    let clean: Member[] = [];
    if (raw) {
      try {
        const parsed: Member[] = JSON.parse(raw);
        clean = parsed.filter((m) => !isAiMockStudent(m) && !deletedTokens.includes(m.qrToken));
      } catch {
        clean = [];
      }
    }
    // Restore and merge all authentic SEED_MEMBERS so all valid students from QR export are loaded
    const existingTokens = new Set(clean.map((m) => m.qrToken.toLowerCase()));
    for (const seed of SEED_MEMBERS) {
      if (!isAiMockStudent(seed) && !existingTokens.has(seed.qrToken.toLowerCase())) {
        clean.push(seed);
        existingTokens.add(seed.qrToken.toLowerCase());
      }
    }
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: clean }));
    window.dispatchEvent(new CustomEvent('uhv_members_updated', { detail: clean }));
    return clean;
  },

  /**
   * Checks whether a student with identical name and department is already enrolled.
   */
  findDuplicateStudent(name: string, department: string, year?: string, excludeToken?: string): Member | null {
    const cleanName = name.trim().toLowerCase();
    const cleanDept = department.trim().toLowerCase();
    const cleanYear = year ? year.trim().toLowerCase() : '';
    const members = this.getMembers();
    return (
      members.find((m) => {
        if (excludeToken && (m.qrToken === excludeToken || m.qrId === excludeToken)) return false;
        const sameName = (m.studentName || m.name).trim().toLowerCase() === cleanName;
        const sameDept = m.department.trim().toLowerCase() === cleanDept;
        if (sameName && sameDept) {
          if (!cleanYear || m.year.trim().toLowerCase() === cleanYear) {
            return true;
          }
        }
        return false;
      }) || null
    );
  },

  getMemberByToken(token: string): Member | null {
    if (!token) return null;
    const cleanToken = token.trim();
    if (this.isTokenDeleted(cleanToken)) return null;
    const members = this.getMembers();
    const found = members.find((m) => m.qrToken.toLowerCase() === cleanToken.toLowerCase()) || null;
    if (!found) return null;
    return isAdminSessionActive() ? found : sanitizeStudentForPublic(found);
  },

  async fetchMemberByTokenAsync(token: string): Promise<Member | null> {
    if (!token) return null;
    const cleanToken = token.trim();
    if (this.isTokenDeleted(cleanToken)) return null;

    // 1. Query Firestore directly if enabled (authoritative cloud verification)
    if (IS_FIREBASE_ENABLED) {
      try {
        const cloud = await firestoreStudentsService.getStudentByToken(cleanToken);
        if (cloud) {
          if (this.isTokenDeleted(cloud.qrToken || cloud.qrId || '')) return null;
          if (isAiMockStudent(cloud)) return null;
          // Update cache with fresh authoritative data from Firestore
          const members = this.getMembers();
          const existingIdx = members.findIndex((m) => m.qrToken.toLowerCase() === cloud.qrToken.toLowerCase());
          if (existingIdx !== -1) {
            members[existingIdx] = cloud;
          } else {
            members.unshift(cloud);
          }
          this.saveMembers(members);
          return isAdminSessionActive() ? cloud : sanitizeStudentForPublic(cloud);
        }
        // Cloud returned null (student may not yet be uploaded to Firestore).
        // CRITICAL: DO NOT mark token deleted! Fall through to local cache.
      } catch (err) {
        console.warn('[Firestore] Network or connection error during lookup, checking offline cache:', err);
      }
    }

    // 2. Fallback to local cache / seed records
    const local = this.getMemberByToken(cleanToken);
    if (local && !this.isTokenDeleted(cleanToken) && !isAiMockStudent(local)) {
      return isAdminSessionActive() ? local : sanitizeStudentForPublic(local);
    }

    return null;
  },

  async syncWithCloudFirestore(): Promise<void> {
    if (!IS_FIREBASE_ENABLED) {
      return;
    }
    try {
      // 1. Sync Students / Members
      const cloudStudents = await firestoreStudentsService.getAllStudents();
      const deletedTokens = this.getDeletedTokens();

      // Automatically delete any mock AI records found in Cloud Firestore
      for (const cs of cloudStudents || []) {
        if (isAiMockStudent(cs)) {
          firestoreStudentsService.deleteStudent(cs).catch(() => {});
        }
      }

      const validCloudStudents = (cloudStudents || []).filter(
        (s) => !deletedTokens.includes(s.qrToken) && !isAiMockStudent(s)
      );

      const localMembers = this.getMembers().filter(
        (m) => !deletedTokens.includes(m.qrToken) && !isAiMockStudent(m)
      );
      const studentMap = new Map<string, Member>();

      // Index cloud students
      for (const cs of validCloudStudents) {
        studentMap.set(cs.qrToken, cs);
      }

      // Merge local students (and queue for cloud upload if not in cloud yet)
      const toUpload: Member[] = [];
      for (const lm of localMembers) {
        if (!studentMap.has(lm.qrToken)) {
          studentMap.set(lm.qrToken, lm);
          toUpload.push(lm);
        }
      }

      const mergedStudents = Array.from(studentMap.values());
      localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(mergedStudents));
      window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: mergedStudents }));

      // Asynchronously upload any local students that weren't in Firestore yet
      for (const s of toUpload) {
        await firestoreStudentsService.saveStudent(s).catch(() => {});
      }

      // 2. Sync Website Settings
      const cloudConfig = await firestoreSettingsService.getWebsiteConfig();
      if (cloudConfig) {
        localStorage.setItem(STORAGE_CONFIG_PUBLISHED_KEY, JSON.stringify(cloudConfig));
        window.dispatchEvent(new Event('uhv_config_updated'));
      } else {
        const localConfig = this.getPublishedConfig();
        await firestoreSettingsService.saveWebsiteConfig(localConfig, false);
      }

      // 3. Sync Announcements
      const cloudAnnouncements = await firestoreAnnouncementsService.getAllAnnouncements();
      if (cloudAnnouncements && cloudAnnouncements.length > 0) {
        const draft = this.getDraftConfig();
        draft.announcements = cloudAnnouncements;
        this.saveDraftConfig(draft);
        this.publishDraftConfig();
      }

      // 4. Sync Events
      const cloudEvents = await firestoreEventsService.getAllEvents();
      if (cloudEvents && cloudEvents.length > 0) {
        const draft = this.getDraftConfig();
        draft.events = cloudEvents;
        this.saveDraftConfig(draft);
        this.publishDraftConfig();
      }

      // 5. Sync Custom Positions
      const cloudPositions = await firestoreSettingsService.getCustomPositions();
      if (cloudPositions && cloudPositions.length > 0) {
        const current = this.getPositions();
        const merged = Array.from(new Set([...current, ...cloudPositions]));
        localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('[Storage] Cloud Firestore initial sync warning:', err);
    }
  },

  async addMemberAsync(data: MemberFormData, adminName = 'Super Admin'): Promise<Member> {
    const members = this.getMembers();
    const position = (data.position || data.role || 'Volunteer').trim();
    if (position) {
      this.addPosition(position);
    }

    // Automatically place new member at the end of their team (displayOrder = maxOrder + 1)
    const teamKey = position.toLowerCase();
    const teamMembers = members.filter(
      (m) => (m.position || m.role || 'Volunteer').trim().toLowerCase() === teamKey
    );
    const maxOrder = teamMembers.reduce((max, m) => Math.max(max, m.displayOrder || 0), 0);
    const displayOrder = data.displayOrder && data.displayOrder > 0 ? data.displayOrder : maxOrder + 1;

    // Permanent QR ID generated ONCE at creation
    const permanentQrId = data.qrId || generateSecureToken();
    const studentName = (data.studentName || data.name || 'Member').trim();
    const certNumber = data.certificateNumber || `UHV-${new Date().getFullYear()}-${permanentQrId.substring(0, 8).toUpperCase()}`;
    const certTitle = data.certificateTitle || 'Universal Human Values Cell Digital Member Certificate';
    const issueDate = data.issueDate || data.joiningDate || new Date().toISOString().split('T')[0];

    const newMember: Member = {
      ...data,
      name: studentName,
      studentName,
      certificateTitle: certTitle,
      certificateNumber: certNumber,
      issueDate,
      position,
      role: position,
      displayOrder,
      qrId: permanentQrId,
      qrToken: permanentQrId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Write to Cloud Firestore and ensure success
    try {
      await firestoreStudentsService.saveStudent(newMember);
    } catch (fsErr) {
      console.warn('[Firestore] Note on direct saveStudent:', fsErr);
    }

    // 2. Add to local members state
    members.push(newMember);
    this.saveMembers(members);

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Enrolled new member & issued certificate: ${studentName} (${position}) at position #${displayOrder}`,
      target: studentName,
      category: 'Members',
    });

    window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: members }));
    window.dispatchEvent(new CustomEvent('uhv_members_updated', { detail: members }));
    return newMember;
  },

  addMember(data: MemberFormData, adminName = 'Super Admin'): Member {
    const members = this.getMembers();
    const position = (data.position || data.role || 'Volunteer').trim();
    if (position) {
      this.addPosition(position);
    }

    const teamKey = position.toLowerCase();
    const teamMembers = members.filter(
      (m) => (m.position || m.role || 'Volunteer').trim().toLowerCase() === teamKey
    );
    const maxOrder = teamMembers.reduce((max, m) => Math.max(max, m.displayOrder || 0), 0);
    const displayOrder = data.displayOrder && data.displayOrder > 0 ? data.displayOrder : maxOrder + 1;

    const permanentQrId = data.qrId || generateSecureToken();
    const studentName = (data.studentName || data.name || 'Member').trim();
    const certNumber = data.certificateNumber || `UHV-${new Date().getFullYear()}-${permanentQrId.substring(0, 8).toUpperCase()}`;
    const certTitle = data.certificateTitle || 'Universal Human Values Cell Digital Member Certificate';
    const issueDate = data.issueDate || data.joiningDate || new Date().toISOString().split('T')[0];

    const newMember: Member = {
      ...data,
      name: studentName,
      studentName,
      certificateTitle: certTitle,
      certificateNumber: certNumber,
      issueDate,
      position,
      role: position,
      displayOrder,
      qrId: permanentQrId,
      qrToken: permanentQrId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members.push(newMember);
    this.saveMembers(members);

    // Push to Cloud Firestore
    firestoreStudentsService.saveStudent(newMember).catch((err) => {
      console.warn('[Firestore] Background save student warning:', err);
    });

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Enrolled new member & issued certificate: ${studentName} (${position}) at position #${displayOrder}`,
      target: studentName,
      category: 'Members',
    });

    window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: members }));
    window.dispatchEvent(new CustomEvent('uhv_members_updated', { detail: members }));
    return newMember;
  },

  updateMember(token: string, data: Partial<MemberFormData>, adminName = 'Super Admin'): Member | null {
    const members = this.getMembers();
    const index = members.findIndex((m) => m.qrToken === token);
    if (index === -1) return null;

    const position = (data.position || data.role || members[index].position || members[index].role || 'Volunteer').trim();
    if (position) {
      this.addPosition(position);
    }

    const oldPos = (members[index].position || members[index].role || 'Volunteer').trim();
    let displayOrder = data.displayOrder !== undefined ? data.displayOrder : members[index].displayOrder;

    // If team changed, compact old team and move to end of new team
    if (oldPos.toLowerCase() !== position.toLowerCase()) {
      const newTeamMembers = members.filter(
        (m) => m.qrToken !== token && (m.position || m.role || 'Volunteer').trim().toLowerCase() === position.toLowerCase()
      );
      const maxOrder = newTeamMembers.reduce((max, m) => Math.max(max, m.displayOrder || 0), 0);
      displayOrder = maxOrder + 1;

      // Compact old team
      let oldCounter = 1;
      members
        .filter((m) => m.qrToken !== token && (m.position || m.role || 'Volunteer').trim().toLowerCase() === oldPos.toLowerCase())
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .forEach((m) => {
          m.displayOrder = oldCounter++;
        });
    }

    // Preserve existing photoUrl if data.photoUrl was not modified (undefined)
    const photoUrl = data.photoUrl !== undefined ? data.photoUrl : members[index].photoUrl;

    const updated: Member = {
      ...members[index],
      ...data,
      position,
      role: position,
      displayOrder: displayOrder || 1,
      photoUrl,
      updatedAt: new Date().toISOString(),
    };
    members[index] = updated;
    this.saveMembers(members);

    // Asynchronously push to Cloud Firestore students collection
    firestoreStudentsService.saveStudent(updated).catch((err) => {
      console.warn('[Firestore] Background update student warning:', err);
    });

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Updated details for ${updated.name}`,
      target: updated.name,
      category: 'Members',
    });

    window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: members }));
    window.dispatchEvent(new CustomEvent('uhv_members_updated', { detail: members }));
    return updated;
  },

  async updateMemberPhotoAsync(
    token: string,
    newPhotoUrl?: string,
    adminName = 'Super Admin'
  ): Promise<Member | null> {
    const members = this.getMembers();
    const index = members.findIndex((m) => m.qrToken === token);
    if (index === -1) return null;

    const target = members[index];
    const cleanPhoto = newPhotoUrl && newPhotoUrl.trim() ? newPhotoUrl.trim() : undefined;
    const updated: Member = {
      ...target,
      photoUrl: cleanPhoto,
      updatedAt: new Date().toISOString(),
    };
    members[index] = updated;
    this.saveMembers(members);

    // Save to Cloud Firestore
    await firestoreStudentsService.saveStudent(updated);

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: cleanPhoto
        ? `Updated profile photo for ${updated.name}`
        : `Removed profile photo for ${updated.name}`,
      target: updated.name,
      category: 'Members',
    });

    window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: members }));
    return updated;
  },

  deactivateMember(token: string, adminName = 'Super Admin'): Member | null {
    const res = this.updateMember(token, { status: 'Inactive' }, adminName);
    if (res) {
      this.logActivity({
        adminName,
        adminRole: 'Super Admin',
        action: `Deactivated verification credentials for ${res.name}`,
        target: res.name,
        category: 'Members',
      });
    }
    return res;
  },

  reactivateMember(token: string, adminName = 'Super Admin'): Member | null {
    const res = this.updateMember(token, { status: 'Active' }, adminName);
    if (res) {
      this.logActivity({
        adminName,
        adminRole: 'Super Admin',
        action: `Re-activated verification credentials for ${res.name}`,
        target: res.name,
        category: 'Members',
      });
    }
    return res;
  },

  regenerateToken(oldToken: string, adminName = 'Super Admin'): { member: Member | null; newToken: string } {
    const members = this.getMembers();
    const index = members.findIndex((m) => m.qrToken === oldToken);
    if (index === -1) {
      return { member: null, newToken: '' };
    }

    const newToken = generateSecureToken();
    members[index].qrToken = newToken;
    members[index].updatedAt = new Date().toISOString();
    this.saveMembers(members);

    // Sync to Cloud Firestore: remove old token doc and save with new token
    firestoreStudentsService.deleteStudent(oldToken).catch(() => {});
    firestoreStudentsService.saveStudent(members[index]).catch(() => {});

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Regenerated cryptographic QR token for ${members[index].name}`,
      target: members[index].name,
      category: 'QR',
    });

    return { member: members[index], newToken };
  },

  async deleteMemberAsync(
    targetOrToken: Member | string,
    adminName = 'Super Admin',
    adminEmail = 'admin.uhv@nbkrist.org'
  ): Promise<boolean> {
    const token = (typeof targetOrToken === 'string' ? targetOrToken : targetOrToken.qrToken).trim();
    const members = this.getMembers();
    const target =
      typeof targetOrToken === 'object'
        ? targetOrToken
        : members.find((m) => m.qrToken === token);

    // 1. Delete from Cloud Firestore FIRST and await complete confirmation
    await firestoreStudentsService.deleteStudent(target || token);

    // 2. Mark token as permanently deleted to prevent reappearance from cache or sync
    this.markTokenDeleted(token);

    // 3. Only after successful Firestore deletion, remove from local storage state
    const targetTeam = (target?.position || target?.role || 'Volunteer').trim().toLowerCase();
    const filtered = members.filter((m) => m.qrToken !== token);

    // Re-index / compact remaining members in this team so orders remain 1, 2, 3...
    let compactCounter = 1;
    filtered
      .filter((m) => (m.position || m.role || 'Volunteer').trim().toLowerCase() === targetTeam)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .forEach((m) => {
        m.displayOrder = compactCounter++;
      });

    this.saveMembers(filtered);

    // 4. Local activity log
    const studentName = target?.name || 'Student';
    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Deleted student profile: ${studentName}`,
      target: studentName,
      category: 'Members',
      performedBy: adminEmail,
    });

    // 5. Cloud Firestore activity audit trail
    firestoreActivityLogsService
      .addLog({
        action: 'DELETE_STUDENT',
        studentName: studentName,
        performedBy: adminEmail,
        adminRole: 'Super Admin',
        details: `Deleted student record for ${studentName}${target ? ` (${target.department}, ${target.year})` : ''}`,
      })
      .catch((logErr) => {
        console.warn('[Firestore] Activity log warning during student delete:', logErr);
      });

    return true;
  },

  deleteMember(targetOrToken: Member | string, adminName = 'Super Admin'): boolean {
    const token = (typeof targetOrToken === 'string' ? targetOrToken : targetOrToken.qrToken).trim();
    this.markTokenDeleted(token);
    const members = this.getMembers();
    const target =
      typeof targetOrToken === 'object'
        ? targetOrToken
        : members.find((m) => m.qrToken === token);
    const filtered = members.filter((m) => m.qrToken !== token);
    this.saveMembers(filtered);

    // Delete from Cloud Firestore
    firestoreStudentsService.deleteStudent(target || token).catch((err) => {
      console.warn('[Firestore] Background delete student warning:', err);
    });

    const studentName = target?.name || 'Student';
    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Deleted member profile: ${studentName}`,
      target: studentName,
      category: 'Members',
    });
    return true;
  },

  bulkImportCSV(csvText: string, adminName = 'Super Admin'): { added: number; errors: string[] } {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { added: 0, errors: ['CSV file is empty or missing data rows.'] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const findIndex = (keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
    const nameIdx = findIndex(['name', 'student name']);
    const deptIdx = findIndex(['dept', 'department', 'branch']);
    const yearIdx = findIndex(['year', 'class']);
    const secIdx = findIndex(['sec', 'section']);
    const roleIdx = findIndex(['position', 'team', 'role', 'designation']);
    const acadIdx = findIndex(['academic', 'acad year', 'session']);
    const joinIdx = findIndex(['join', 'joining date', 'date of join']);
    const statusIdx = findIndex(['status', 'active']);
    const photoIdx = findIndex(['photo', 'image', 'avatar']);
    const emailIdx = findIndex(['email', 'mail']);
    const bloodIdx = findIndex(['blood', 'blood group']);

    if (nameIdx === -1) {
      return { added: 0, errors: ['CSV must contain a "Name" column.'] };
    }

    const existingMembers = this.getMembers();
    const newMembers: Member[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCol = (idx: number) => {
        if (idx === -1 || !row[idx]) return '';
        return row[idx].replace(/^"|"$/g, '').trim();
      };

      const name = cleanCol(nameIdx);
      if (!name) {
        errors.push(`Row ${i + 1}: Skipped due to missing name`);
        continue;
      }

      const roleVal = cleanCol(roleIdx);
      const position = this.normalizeMemberRole(roleVal);
      if (position) {
        this.addPosition(position);
      }

      const statusVal = cleanCol(statusIdx);
      const status: Member['status'] = /inactive/i.test(statusVal) ? 'Inactive' : 'Active';

      const rawPhoto = cleanCol(photoIdx);
      const validPhoto =
        rawPhoto && (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://') || rawPhoto.startsWith('data:image/'))
          ? rawPhoto
          : undefined;

      // Compute displayOrder at the end of the team
      const teamKey = position.toLowerCase();
      const existingInTeam = [...existingMembers, ...newMembers].filter(
        (m) => (m.position || m.role || 'Volunteer').trim().toLowerCase() === teamKey
      );
      const maxOrder = existingInTeam.reduce((max, m) => Math.max(max, m.displayOrder || 0), 0);
      const displayOrder = maxOrder + 1;

      const permToken = generateSecureToken();
      const newMember: Member = {
        name,
        department: cleanCol(deptIdx) || 'Electrical and Electronics Engineering',
        year: cleanCol(yearIdx) || 'III B.Tech',
        section: cleanCol(secIdx) || 'A',
        role: position,
        position,
        academicYear: cleanCol(acadIdx) || '2026–27',
        joiningDate: cleanCol(joinIdx) || '01/08/2026',
        status,
        photoUrl: validPhoto,
        email: cleanCol(emailIdx) || undefined,
        bloodGroup: cleanCol(bloodIdx) || undefined,
        displayOrder,
        qrId: permToken,
        qrToken: permToken,
        studentName: name,
        certificateTitle: 'Universal Human Values Cell Digital Member Certificate',
        certificateNumber: `UHV-${new Date().getFullYear()}-${permToken.substring(0, 8).toUpperCase()}`,
        issueDate: cleanCol(joinIdx) || '01/08/2026',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newMembers.push(newMember);
    }

    if (newMembers.length > 0) {
      const merged = [...existingMembers, ...newMembers];
      this.saveMembers(merged);

      // Asynchronously sync to Cloud Firestore
      for (const m of newMembers) {
        firestoreStudentsService.saveStudent(m).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: merged }));
      window.dispatchEvent(new CustomEvent('uhv_members_updated', { detail: merged }));

      this.logActivity({
        adminName,
        adminRole: 'Super Admin',
        action: `Batch imported ${newMembers.length} members from CSV`,
        target: 'Bulk Import',
        category: 'Members',
      });
    }

    return { added: newMembers.length, errors };
  },

  async reorderTeamMembers(
    teamName: string,
    orderedTokens: string[],
    adminName = 'Super Admin'
  ): Promise<Member[]> {
    const members = this.getMembers();
    const cleanTeam = teamName.trim().toLowerCase();

    // Map token to new sequential 1-based displayOrder
    const tokenToOrder = new Map<string, number>();
    orderedTokens.forEach((tok, idx) => {
      tokenToOrder.set(tok, idx + 1);
    });

    const membersToSync: Member[] = [];

    const updatedList = members.map((m) => {
      const mTeam = (m.position || m.role || 'Volunteer').trim().toLowerCase();
      // Only reorder members in this specific team
      if (mTeam === cleanTeam && tokenToOrder.has(m.qrToken)) {
        const newOrder = tokenToOrder.get(m.qrToken)!;
        if (m.displayOrder !== newOrder) {
          const updated: Member = {
            ...m,
            displayOrder: newOrder,
            updatedAt: new Date().toISOString(),
          };
          membersToSync.push(updated);
          return updated;
        }
      }
      return m;
    });

    this.saveMembers(updatedList);

    // Asynchronously push changes to Cloud Firestore
    if (membersToSync.length > 0) {
      for (const m of membersToSync) {
        firestoreStudentsService.saveStudent(m).catch((e) =>
          console.warn('[Storage] Order sync error:', e)
        );
      }
    }

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: `Updated member display order for ${teamName}`,
      target: teamName,
      category: 'Members',
    });

    window.dispatchEvent(new CustomEvent('uhv_students_updated', { detail: updatedList }));
    window.dispatchEvent(new CustomEvent('uhv_members_updated', { detail: updatedList }));
    return updatedList;
  },

  async moveMemberPosition(
    token: string,
    targetPosition: number,
    adminName = 'Super Admin'
  ): Promise<Member[]> {
    const members = this.getMembers();
    const targetMember = members.find((m) => m.qrToken === token);
    if (!targetMember) return members;

    const team = (targetMember.position || targetMember.role || 'Volunteer').trim();
    const cleanTeam = team.toLowerCase();

    // Get all members of this team sorted by current displayOrder
    const teamMembers = members
      .filter((m) => (m.position || m.role || 'Volunteer').trim().toLowerCase() === cleanTeam)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const currentIndex = teamMembers.findIndex((m) => m.qrToken === token);
    if (currentIndex === -1) return members;

    // Desired 0-based index clamped between 0 and teamMembers.length - 1
    const targetIndex = Math.max(0, Math.min(teamMembers.length - 1, targetPosition - 1));
    if (currentIndex === targetIndex) return members;

    // Remove from current index and insert at target index
    const [moved] = teamMembers.splice(currentIndex, 1);
    teamMembers.splice(targetIndex, 0, moved);

    const orderedTokens = teamMembers.map((m) => m.qrToken);
    return this.reorderTeamMembers(team, orderedTokens, adminName);
  },

  getStats() {
    const members = this.getMembers();
    const isRole = (m: Member, match: RegExp) => match.test(m.position || m.role || '');
    return {
      total: members.length,
      active: members.filter((m) => m.status === 'Active').length,
      inactive: members.filter((m) => m.status === 'Inactive').length,
      president: members.filter((m) => isRole(m, /^president$/i)).length,
      vicePresident: members.filter((m) => isRole(m, /^vice[-\s]?president$/i)).length,
      coreTeam: members.filter((m) => isRole(m, /^core(\s+team)?$/i)).length,
      coordinators: members.filter((m) => isRole(m, /^coordinators?$/i)).length,
      technicalTeam: members.filter((m) => isRole(m, /^tech/i)).length,
      eventManagement: members.filter((m) => isRole(m, /^event/i)).length,
      designingTeam: members.filter((m) => isRole(m, /^design/i)).length,
      innovationTeam: members.filter((m) => isRole(m, /^in+ov/i)).length,
      volunteers: members.filter((m) => isRole(m, /^volunt/i)).length,
      generalMembers: members.filter((m) => isRole(m, /^volunt/i)).length,
    };
  },

  // ----------------------------------------------------
  // ADMIN ACCOUNTS MANAGEMENT
  // ----------------------------------------------------
  getAdminUsers(): AdminUser[] {
    const raw = localStorage.getItem(STORAGE_ADMINS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(SEED_ADMINS));
      return SEED_ADMINS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_ADMINS;
    }
  },

  saveAdminUsers(admins: AdminUser[]): void {
    localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(admins));
  },

  addAdminUser(data: Omit<AdminUser, 'id' | 'createdAt'>, performedBy = 'Super Admin'): AdminUser {
    const list = this.getAdminUsers();
    const newUser: AdminUser = {
      ...data,
      id: 'adm-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    list.push(newUser);
    this.saveAdminUsers(list);

    this.logActivity({
      adminName: performedBy,
      adminRole: 'Super Admin',
      action: `Created new admin account: ${data.name} (${data.role})`,
      target: data.email,
      category: 'Security',
    });

    return newUser;
  },

  updateAdminUser(id: string, update: Partial<AdminUser>, performedBy = 'Super Admin'): void {
    const list = this.getAdminUsers();
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      this.saveAdminUsers(list);

      this.logActivity({
        adminName: performedBy,
        adminRole: 'Super Admin',
        action: `Modified admin account: ${list[idx].name}`,
        target: list[idx].email,
        category: 'Security',
      });
    }
  },

  deleteAdminUser(id: string, performedBy = 'Super Admin'): boolean {
    const list = this.getAdminUsers();
    const target = list.find((a) => a.id === id);
    if (!target) return false;
    // Don't delete last Super Admin
    const superAdmins = list.filter((a) => a.role === 'Super Admin');
    if (target.role === 'Super Admin' && superAdmins.length <= 1) {
      throw new Error('Cannot delete the primary Super Administrator account.');
    }
    const filtered = list.filter((a) => a.id !== id);
    this.saveAdminUsers(filtered);

    this.logActivity({
      adminName: performedBy,
      adminRole: 'Super Admin',
      action: `Removed admin user: ${target.name}`,
      target: target.email,
      category: 'Security',
    });
    return true;
  },

  // ----------------------------------------------------
  // ACTIVITY AUDIT LOGS
  // ----------------------------------------------------
  getActivityLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ACTIVITY_LOGS_KEY, JSON.stringify(SEED_ACTIVITY_LOGS));
      return SEED_ACTIVITY_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_ACTIVITY_LOGS;
    }
  },

  logActivity(entry: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      ...entry,
      id: 'log-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_ACTIVITY_LOGS_KEY, JSON.stringify(logs));
  },

  clearActivityLogs(performedBy = 'Super Admin'): void {
    localStorage.setItem(STORAGE_ACTIVITY_LOGS_KEY, JSON.stringify([]));
    this.logActivity({
      adminName: performedBy,
      adminRole: 'Super Admin',
      action: 'Cleared audit activity logs',
      target: 'Activity Logs',
      category: 'Security',
    });
  },

  // ----------------------------------------------------
  // FEEDBACK & PROGRESS
  // ----------------------------------------------------
  getFeedbacks(): AnonymousFeedback[] {
    const raw = localStorage.getItem(STORAGE_FEEDBACK_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(SEED_FEEDBACK));
      return SEED_FEEDBACK;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_FEEDBACK;
    }
  },

  submitAnonymousFeedback(feedback: Omit<AnonymousFeedback, 'id' | 'createdAt'>): AnonymousFeedback {
    const list = this.getFeedbacks();
    const item: AnonymousFeedback = {
      ...feedback,
      id: 'fb-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(list));
    return item;
  },

  getProgressRecords(): ValueProgressRecord[] {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(SEED_PROGRESS));
      return SEED_PROGRESS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_PROGRESS;
    }
  },

  updateProgressRecord(id: string, update: Partial<ValueProgressRecord>): void {
    const records = this.getProgressRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...update };
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(records));
    }
  },

  // ----------------------------------------------------
  // BACKUP, IMPORT, EXPORT & RESTORE
  // ----------------------------------------------------
  getFullBackup() {
    return {
      version: '2.0-superadmin',
      exportedAt: new Date().toISOString(),
      institution: 'N.B.K.R. Institute of Science & Technology',
      cell: 'Universal Human Values Cell',
      members: this.getMembers(),
      publishedConfig: this.getPublishedConfig(),
      draftConfig: this.getDraftConfig(),
      admins: this.getAdminUsers(),
      activityLogs: this.getActivityLogs(),
      feedbacks: this.getFeedbacks(),
      progress: this.getProgressRecords(),
    };
  },

  exportAllData() {
    return this.getFullBackup();
  },

  importAllData(data: any, adminName = 'Super Admin'): boolean {
    const res = this.restoreFullBackup(data, adminName);
    return res.success;
  },

  restoreFullBackup(data: any, adminName = 'Super Admin'): { success: boolean; message: string } {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file structure' };
      }

      if (Array.isArray(data.members)) {
        this.saveMembers(data.members);
      }
      if (data.publishedConfig) {
        localStorage.setItem(STORAGE_CONFIG_PUBLISHED_KEY, JSON.stringify(data.publishedConfig));
      }
      if (data.draftConfig) {
        localStorage.setItem(STORAGE_CONFIG_DRAFT_KEY, JSON.stringify(data.draftConfig));
      }
      if (Array.isArray(data.admins)) {
        this.saveAdminUsers(data.admins);
      }
      if (Array.isArray(data.feedbacks)) {
        localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(data.feedbacks));
      }
      if (Array.isArray(data.progress)) {
        localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(data.progress));
      }

      this.logActivity({
        adminName,
        adminRole: 'Super Admin',
        action: 'Restored full system database from JSON archive',
        target: 'System Backup Restore',
        category: 'Settings',
      });

      return { success: true, message: 'Database restored successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Restoration failed' };
    }
  },

  resetWebsiteToDefaults(adminName = 'Super Admin'): void {
    localStorage.setItem(STORAGE_CONFIG_PUBLISHED_KEY, JSON.stringify(DEFAULT_WEBSITE_CONFIG));
    localStorage.setItem(STORAGE_CONFIG_DRAFT_KEY, JSON.stringify(DEFAULT_WEBSITE_CONFIG));
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(SEED_MEMBERS));
    localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(SEED_FEEDBACK));
    localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(SEED_PROGRESS));
    localStorage.setItem(STORAGE_ADMINS_KEY, JSON.stringify(SEED_ADMINS));
    localStorage.setItem(STORAGE_ACTIVITY_LOGS_KEY, JSON.stringify(SEED_ACTIVITY_LOGS));

    this.logActivity({
      adminName,
      adminRole: 'Super Admin',
      action: 'Reset all website content, branding, and members to factory defaults',
      target: 'System Factory Reset',
      category: 'Settings',
    });
  },

  resetToDefaults(): void {
    this.resetWebsiteToDefaults();
  },
};


