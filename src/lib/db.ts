import { School, Student, Payment, SchoolSettings, Announcement, AttendanceRecord, SpecialRequest } from "../types";

// Helper to handle local storage mock data
class MockDB {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(`edubenin_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(`edubenin_${key}`, JSON.stringify(data));
  }

  // School Settings
  getSchoolSettings(): SchoolSettings {
    const settings = this.get<SchoolSettings>("schoolSettings");
    if (settings.length === 0) {
      const defaultSettings: SchoolSettings = {
        id: "school_1",
        name: "Lycée Béhanzin",
        address: "Zounmè, Porto-Novo, Bénin",
        contact: "+229 22 22 22 22 | lyceebehanzin@edu.bj",
        motto: "Travail - Rigueur - Succès",
        logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&h=128&fit=crop",
        academicYear: "2025 - 2026"
      };
      this.set("schoolSettings", [defaultSettings]);
      return defaultSettings;
    }
    return settings[0];
  }

  updateSchoolSettings(updates: Partial<SchoolSettings>): SchoolSettings {
    const current = this.getSchoolSettings();
    const updated = { ...current, ...updates };
    this.set("schoolSettings", [updated]);
    return updated;
  }

  // Schools
  getSchools(): School[] {
    const schools = this.get<School>("schools");
    if (schools.length === 0) {
      // Seed data
      const defaultSchool: School = {
        id: "school_1",
        name: "Lycée Béhanzin",
        locality: "Porto-Novo",
        contacts: "22 22 22 22",
        createdAt: Date.now(),
        mobileMoneyNumbers: { moov: "94 00 00 00", mtn: "97 00 00 00" }
      };
      this.set("schools", [defaultSchool]);
      return [defaultSchool];
    }
    return schools;
  }

  addSchool(school: Omit<School, "id" | "createdAt">): School {
    const schools = this.getSchools();
    const newSchool: School = {
      ...school,
      id: `school_${Date.now()}`,
      createdAt: Date.now()
    };
    this.set("schools", [...schools, newSchool]);
    return newSchool;
  }

  // Students
  getStudents(filter?: { parentId?: string; schoolId?: string }): Student[] {
    let students = this.get<Student>("students");
    if (filter?.parentId) students = students.filter(s => s.parentId === filter.parentId);
    if (filter?.schoolId) students = students.filter(s => s.schoolId === filter.schoolId);
    return students;
  }

  addStudent(student: Omit<Student, "id" | "createdAt">): Student {
    const students = this.get<Student>("students");
    const newStudent: Student = {
      ...student,
      id: `student_${Date.now()}`,
      createdAt: Date.now()
    };
    this.set("students", [...students, newStudent]);
    return newStudent;
  }

  updateStudent(id: string, updates: Partial<Student>): Student {
    const students = this.get<Student>("students");
    const index = students.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Student not found");
    const updatedStudent = { ...students[index], ...updates };
    students[index] = updatedStudent;
    this.set("students", students);
    return updatedStudent;
  }

  deleteStudent(id: string): void {
    const students = this.get<Student>("students");
    const index = students.findIndex((s) => s.id === id);
    if (index !== -1) {
      students.splice(index, 1);
      this.set("students", students);
    }
  }

  // Payments
  getPayments(filter?: { parentId?: string; schoolId?: string }): Payment[] {
    let payments = this.get<Payment>("payments");
    if (filter?.parentId) payments = payments.filter(p => p.parentId === filter.parentId);
    if (filter?.schoolId) payments = payments.filter(p => p.schoolId === filter.schoolId);
    return payments;
  }

  addPayment(payment: Omit<Payment, "id" | "date" | "status" | "reference">): Payment {
    const payments = this.get<Payment>("payments");
    const newPayment: Payment = {
      ...payment,
      id: `pay_${Date.now()}`,
      date: Date.now(),
      status: "COMPLETED", // Mock auto-complete for demonstration
      reference: `REF-${Math.floor(Math.random() * 1000000)}`
    };
    this.set("payments", [...payments, newPayment]);
    return newPayment;
  }

  // Announcements
  getAnnouncements(): Announcement[] {
    return this.get<Announcement>("announcements");
  }

  addAnnouncement(announcement: Omit<Announcement, "id" | "date">): Announcement {
    const announcements = this.getAnnouncements();
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `ann_${Date.now()}`,
      date: Date.now()
    };
    this.set("announcements", [...announcements, newAnnouncement]);
    return newAnnouncement;
  }

  deleteAnnouncement(id: string): void {
    const announcements = this.getAnnouncements();
    this.set("announcements", announcements.filter(a => a.id !== id));
  }

  // Attendance
  getAttendance(filter?: { studentId?: string }): AttendanceRecord[] {
    const all = this.get<AttendanceRecord>("attendance") || [];
    if (!filter) return all;
    return all.filter(a => {
      if (filter.studentId && a.studentId !== filter.studentId) return false;
      return true;
    });
  }

  addAttendance(record: Omit<AttendanceRecord, "id">): AttendanceRecord {
    const records = this.getAttendance();
    const newRecord: AttendanceRecord = { ...record, id: `att_${Date.now()}` };
    this.set("attendance", [...records, newRecord]);
    return newRecord;
  }

  // Special Requests
  getSpecialRequests(filter?: { parentId?: string, studentId?: string }): SpecialRequest[] {
    const all = this.get<SpecialRequest>("special_requests") || [];
    if (!filter) return all;
    return all.filter(r => {
      if (filter.parentId && r.parentId !== filter.parentId) return false;
      if (filter.studentId && r.studentId !== filter.studentId) return false;
      return true;
    });
  }

  addSpecialRequest(request: Omit<SpecialRequest, "id" | "status" | "createdAt">): SpecialRequest {
    const requests = this.getSpecialRequests();
    const newRequest: SpecialRequest = {
      ...request,
      id: `req_${Date.now()}`,
      status: "PENDING",
      createdAt: Date.now()
    };
    this.set("special_requests", [...requests, newRequest]);
    return newRequest;
  }

  updateSpecialRequest(id: string, updates: Partial<SpecialRequest>): SpecialRequest | undefined {
    let updated: SpecialRequest | undefined;
    const requests = this.getSpecialRequests().map(req => {
      if (req.id === id) {
        updated = { ...req, ...updates };
        return updated;
      }
      return req;
    });
    this.set("special_requests", requests);
    return updated;
  }
}

export const db = new MockDB();
