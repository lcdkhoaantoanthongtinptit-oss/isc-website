import { Timestamp } from 'firebase/firestore';

export type CollaboratorStatus = 'PENDING' | 'PASSED' | 'FAILED';
export type InterviewStatus = 'CHUA_PV' | 'DANG_PV' | 'DAT' | 'KHONG_DAT' | 'CAN_XEM_XET';

export interface Collaborator {
  id: string; // Document ID, usually studentId
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  className: string;
  facebookUrl?: string;
  appliedDepartmentId?: string;
  acceptedDepartmentId?: string | null;
  position: string;
  status: CollaboratorStatus;
  publicNote?: string;
  adminNote?: string;
  isDuplicate?: boolean;
  duplicateTag?: string;
  // Google Form Questionnaire Details
  submittedAt?: string;
  strengths?: string;
  weaknesses?: string;
  interests?: string;
  itExperience?: string;
  referralSource?: string;
  expectations?: string;
  reasonsToJoin?: string;
  // Interview Assessment Details
  interviewScore?: number | null;
  interviewEvaluation?: string;
  interviewStatus?: InterviewStatus;
  interviewerName?: string;
  interviewDate?: string;
  interviewCriteriaScores?: {
    attitude?: number;
    communication?: number;
    professionalSkills?: number;
    commitment?: number;
  };
  createdAt?: string | Timestamp | Date;
  updatedAt?: string | Timestamp | Date;
}

export interface PublicCollaboratorResult {
  found: boolean;
  studentId?: string;
  fullName?: string;
  appliedDepartment?: string;
  acceptedDepartment?: string | null;
  position?: string;
  status?: CollaboratorStatus;
  note?: string;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  isActive: boolean;
  order?: number;
  createdAt?: string | Timestamp | Date;
  updatedAt?: string | Timestamp | Date;
}

export interface Activity {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  category:
    | 'Học thuật'
    | 'Tình nguyện'
    | 'Văn nghệ'
    | 'Thể thao'
    | 'Công nghệ'
    | 'Đoàn Hội'
    | 'Sự kiện'
    | 'Phong trào'
    | 'Kỹ năng';
  eventDate: string | Timestamp | Date;
  location?: string;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt?: string | Timestamp | Date;
  updatedAt?: string | Timestamp | Date;
}

export interface ExecutiveMember {
  id: string;
  fullName: string;
  studentId?: string; // Mã sinh viên (MSV)
  phone?: string; // Số điện thoại (SĐT)
  cohort?: string; // Khóa sinh viên, ví dụ "D23", "D24", "D22", "D21"
  className?: string; // Lớp sinh viên, ví dụ "D23CQAT01-B"
  position: string;
  avatarUrl: string;
  term: string; // Chuỗi hiển thị nhiệm kỳ, ví dụ "Nhiệm kỳ 2026 - 2027"
  termStartYear?: number; // Năm bắt đầu nhiệm kỳ, ví dụ 2026
  termEndYear?: number; // Năm kết thúc nhiệm kỳ, ví dụ 2027
  email: string | null;
  facebook: string | null;
  displayOrder: number;
  createdAt?: string | Timestamp | Date;
  updatedAt?: string | Timestamp | Date;
}

export interface WebsiteSettings {
  organizationName: string;
  shortName?: string;
  foundedYear?: string | number;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription?: string;
  vision?: string;
  mission?: string;
  aboutDescription: string;
  recruitmentTitle?: string;
  recruitmentSubtitle?: string;
  recruitmentDescription?: string;
  recruitmentPeriod?: string;
  whyJoinNewFriends?: string;
  whyJoinGenerations?: string;
  whyJoinNewSkills?: string;
  whyJoinBreakthrough?: string;
  totalStudents: number;
  totalActivities: number;
  totalCollaborators: number;
  activeYears: number;
  email: string;
  phone: string;
  facebook: string;
  address: string;
  imagekitPublicKey?: string;
  imagekitPrivateKey?: string;
  imagekitUrlEndpoint?: string;
  /** Khi true, ứng viên CTV có thể tra cứu kết quả qua /tra-cuu-ctv */
  isResultPublic?: boolean;
  updatedAt?: string | Timestamp | Date;
}

export interface ExcelCollaboratorRow {
  student_id: string;
  full_name: string;
  email: string;
  phone?: string;
  class_name?: string;
  facebook_url?: string;
  applied_department?: string;
  accepted_department?: string;
  position?: string;
  status?: string;
  note?: string;
  admin_note?: string;
  // Google Form questionnaire fields:
  timestamp?: string;
  strengths?: string;
  weaknesses?: string;
  interests?: string;
  it_experience?: string;
  referral_source?: string;
  expectations?: string;
  reasons_to_join?: string;
}

export interface ExcelValidationError {
  rowNumber: number;
  studentId?: string;
  field: string;
  message: string;
}

export type AdminRole =
  | 'admin'
  | 'secretary'
  | 'deputy_secretary'
  | 'lead'
  | 'deputy_lead'
  | 'interviewer'
  | 'recruiter'
  | 'editor';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: AdminRole;
  departmentId?: string | null;
  departmentName?: string | null;
  permissions?: string[]; // Allowed path list, e.g. ['/admin/dashboard', '/admin/collaborators']
  createdAt?: string | Timestamp | Date;
  updatedAt?: string | Timestamp | Date;
}
