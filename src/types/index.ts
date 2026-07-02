export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "SECRETARY" | "PARENT" | "TEACHER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string; // Optional for Super Admin
}

export interface School {
  id: string;
  name: string;
  locality: string;
  logo?: string;
  motto?: string;
  contacts: string;
  mobileMoneyNumbers: {
    moov?: string;
    mtn?: string;
    celtiis?: string;
  };
  createdAt: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  parentId: string;
  schoolId: string;
  level: string; // e.g. Maternelle 1, Terminale D
  classId?: string;
  photo?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  studentType?: "NEW" | "OLD";
  previousClass?: string;
  previousSchool?: string;
  lastYearAttended?: string;
  status?: "PASSING" | "REPEATING" | "EXCLUDED" | "DROPOUT" | "ACTIVE";
  discountPercentage?: number;
  educmasterNumber?: string;
  gender?: "MALE" | "FEMALE";
  nationality?: string;
  religion?: string;
  fatherName?: string;
  motherName?: string;
  fatherProfession?: string;
  motherProfession?: string;
  fatherContact?: string;
  motherContact?: string;
  guardianName?: string;
  guardianContact?: string;
  canteenOptions?: string[];
  disciplinaryCommitment?: boolean;
  disciplinarySignature?: string;
  createdAt: number;
}

export interface SchoolSettings {
  id: string;
  name: string;
  address: string;
  contact: string;
  motto: string;
  logo: string;
  academicYear: string;
  enrollmentContractTemplate?: string;
}

export interface Grade {
  subject: string;
  score: number;
  outOf: number;
  coefficient: number;
  teacher: string;
  appreciation: string;
}

export interface Payment {
  id: string;
  studentId: string;
  parentId: string;
  schoolId: string;
  amount: number;
  date: number;
  network: "Moov Bénin" | "MTN Bénin" | "Celtiis Bénin";
  status: "PENDING" | "COMPLETED" | "FAILED";
  reference: string;
  items?: { id?: string; name: string; amount: number; remaining?: number }[];
  nextPaymentDate?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  type: "ABSENCE" | "DELAY";
  date: number;
  reason?: string;
  isJustified: boolean;
}

export interface SpecialRequest {
  id: string;
  studentId: string;
  parentId: string;
  type: "ABSENCE" | "DELAY" | "OTHER";
  date: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: number;
  authorName: string;
}

export const LEVELS = [
  "Maternelle 1", "Maternelle 2",
  "CI", "CP", "CE1", "CE2", "CM1", "CM2",
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère A", "1ère B", "1ère C", "1ère D",
  "Terminale A", "Terminale B", "Terminale C", "Terminale D"
];
