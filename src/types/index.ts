export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "SECRETARY" | "CASHIER" | "PARENT" | "TEACHER" | "DIRECTOR_OF_STUDIES" | "SUPERVISOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string; // Optional for Super Admin
  phone?: string;
  photoURL?: string;
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
  createdAt?: number;
}

export interface Student {
  id: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  parentId?: string;
  schoolId?: string;
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
  academicYear?: string;
  academic_year?: string;
  school_id?: string;
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
  fatherAddress?: string;
  motherContact?: string;
  motherAddress?: string;
  guardianName?: string;
  guardianContact?: string;
  guardianAddress?: string;
  canteenOptions?: string[];
  disciplinaryCommitment?: boolean;
  disciplinarySignature?: string;
  createdAt?: number;
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
  directorSignature?: string;
}

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
  createdAt: number;
}

export interface FeeConfig {
  id: string;
  schoolId: string;
  level: string;
  feeType: "INSCRIPTION" | "MONTHLY" | "TD" | "TRANSPORT" | "CANTEEN" | "OTHER" | "BOOKS" | "ID_CARD" | "UNIFORMS" | "EVALUATION" | "BOOK_KITS";
  amount: number;
  createdAt: number;
}

export interface Expense {
  id: string;
  schoolId: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: "FOURNITURE" | "FACTURE" | "SALAIRE" | "AUTRE";
  proofUrl?: string;
  createdAt: number;
}

export interface Course {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  level: string;
  createdAt: number;
}

export interface Grade {
  id?: string;
  schoolId?: string;
  studentId?: string;
  courseId?: string;
  evaluationType?: string; // DEVOIR, COMPOSITION, INTERROGATION
  score: number;
  outOf: number;
  coefficient: number;
  subject: string; // legacy support
  teacher: string; // legacy support
  appreciation: string;
  date?: number;
}

export interface Timetable {
  id: string;
  schoolId: string;
  courseId: string;
  dayOfWeek: number; // 1=Lundi
  startTime: string;
  endTime: string;
  room?: string;
  createdAt: number;
}

export interface Payment {
  id: string;
  studentId: string;
  parentId?: string;
  schoolId: string;
  amount: number;
  date?: number;
  network?: "Moov Bénin" | "MTN Bénin" | "Celtiis Bénin" | "CASH";
  paymentMethod?: string;
  paymentDate?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  reference: string;
  items?: { id?: string; name: string; amount: number; remaining?: number }[];
  nextPaymentDate?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  schoolId?: string;
  type: "ABSENCE" | "DELAY";
  date: number;
  reason?: string;
  isJustified: boolean;
  reportedBy?: string;
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
  authorName?: string;
  author?: string;
  targetAudience?: string;
}

export const LEVELS = [
  "Maternelle 1", "Maternelle 2",
  "CI", "CP", "CE1", "CE2", "CM1", "CM2",
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère A", "1ère B", "1ère C", "1ère D",
  "Terminale A", "Terminale B", "Terminale C", "Terminale D"
];
