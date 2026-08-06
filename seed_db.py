import re

with open('src/lib/db.ts', 'r') as f:
    content = f.read()

# Replace getStudents
students_seed = '''  getStudents(filter?: { parentId?: string; schoolId?: string }): Student[] {
    let students = this.get<Student>("students");
    if (students.length === 0) {
      const defaultStudents: Student[] = [
        {
          id: "student_1",
          firstName: "Jean",
          lastName: "DUPONT",
          level: "6ème",
          status: "PASSING",
          createdAt: Date.now(),
          schoolId: "school_1",
          parentId: "parent_1",
          gender: "MALE",
          studentType: "OLD"
        },
        {
          id: "student_2",
          firstName: "Marie",
          lastName: "DUPONT",
          level: "3ème",
          status: "PASSING",
          createdAt: Date.now(),
          schoolId: "school_1",
          parentId: "parent_1",
          gender: "FEMALE",
          studentType: "NEW"
        }
      ];
      this.set("students", defaultStudents);
      students = defaultStudents;
    }

    if (filter?.parentId) students = students.filter(s => s.parentId === filter.parentId);
    if (filter?.schoolId) students = students.filter(s => s.schoolId === filter.schoolId);
    return students;
  }'''
content = re.sub(r'getStudents\(filter\?: \{ parentId\?: string; schoolId\?: string \}\): Student\[\] \{.*?return students;\n  \}', students_seed, content, flags=re.DOTALL)

# Replace getPayments
payments_seed = '''  getPayments(filter?: { parentId?: string; schoolId?: string }): Payment[] {
    let payments = this.get<Payment>("payments");
    if (payments.length === 0) {
      const defaultPayments: Payment[] = [
        {
          id: "pay_1",
          studentId: "student_1",
          amount: 35000,
          date: Date.now() - 86400000,
          status: "COMPLETED",
          reference: "REF-12345",
          schoolId: "school_1",
          parentId: "parent_1",
          items: [{name: "Tranche 1", amount: 35000}],
          paymentMethod: "MTN Bénin"
        }
      ];
      this.set("payments", defaultPayments);
      payments = defaultPayments;
    }
    
    if (filter?.parentId) payments = payments.filter(p => p.parentId === filter.parentId);
    if (filter?.schoolId) payments = payments.filter(p => p.schoolId === filter.schoolId);
    return payments;
  }'''
content = re.sub(r'getPayments\(filter\?: \{ parentId\?: string; schoolId\?: string \}\): Payment\[\] \{.*?return payments;\n  \}', payments_seed, content, flags=re.DOTALL)

with open('src/lib/db.ts', 'w') as f:
    f.write(content)
