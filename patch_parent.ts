import fs from 'fs';

let content = fs.readFileSync('src/pages/Parent.tsx', 'utf-8');

content = content.replace(/import \{ db \} from "\.\.\/lib\/db";\n/g, '');

content = content.replace(
`    if (user?.schoolId) {
      setSettings(db.getSchoolSettings());
      setAnnouncements(db.getAnnouncements());
    }`,
`    if (user?.schoolId) {
      supabase.from('schools').select('*').eq('id', user.schoolId).single().then(({data}) => {
         if (data) setSettings({
            name: data.name,
            address: data.locality,
            contact: data.contacts,
            motto: data.motto || "",
            logo: data.logo_url || "",
            academicYear: data.academic_year || ""
         } as any);
      });
      supabase.from('announcements').select('*').eq('school_id', user.schoolId).order('created_at', { ascending: false }).then(({data}) => {
         if (data) setAnnouncements(data.map((d: any) => ({
            id: d.id,
            title: d.title,
            content: d.content,
            authorName: d.author_name,
            date: new Date(d.created_at).getTime()
         })));
      });
      supabase.from('special_requests').select('*').eq('parent_id', user.id).then(({data}) => {
         // Handle if needed
      });
    }`
);

content = content.replace(
`      db.updateStudent(editingChildId, studentData);`,
`      await supabase.from('students').update({
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        address: studentData.address,
        medical_info: studentData.medicalInfo
      }).eq('id', editingChildId);`
);

content = content.replace(
`      db.addStudent({
        ...studentData,
        schoolId: user?.schoolId || "",
        parentId: user?.id || "",
        status: "PENDING"
      });`,
`      await supabase.from('students').insert({
        school_id: user?.schoolId,
        parent_id: user?.id,
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        address: studentData.address,
        medical_info: studentData.medicalInfo,
        status: 'PENDING'
      });`
);

content = content.replace(
`                     db.addSpecialRequest({
                       schoolId: user?.schoolId || "",
                       studentId: selectedChildForAttendance.id,
                       parentId: user?.id || "",
                       subject: specialRequestSubject,
                       message: specialRequestMessage
                     });
                     alert("Demande envoyée");`,
`                     supabase.from('special_requests').insert({
                       school_id: user?.schoolId,
                       student_id: selectedChildForAttendance.id,
                       parent_id: user?.id,
                       subject: specialRequestSubject,
                       message: specialRequestMessage
                     }).then(() => {
                       alert("Demande envoyée");
                     });`
);

content = content.replace(/db\.getSpecialRequests\(\{ studentId: selectedChildForAttendance.id \}\)/g, '[]');

fs.writeFileSync('src/pages/Parent.tsx', content);

let content2 = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');

content2 = content2.replace(/import \{ db \} from "\.\.\/lib\/db";\n/g, '');

content2 = content2.replace(
`        setSettings(db.getSchoolSettings());`,
`        supabase.from('schools').select('*').eq('id', user.schoolId).single().then(({data}) => {
           if (data) setSettings(data as any);
        });`
);

content2 = content2.replace(
`    const newPayment = db.addPayment({
      schoolId: user?.schoolId || "",
      studentId: selectedChildId,
      parentId: user?.id || "",
      amount: paymentAmount,
      method: "MOBILE_MONEY"
    });
    
    setPayments([...payments, newPayment]);`,
`    supabase.from('payments').insert({
      school_id: user?.schoolId,
      student_id: selectedChildId,
      parent_id: user?.id,
      amount: paymentAmount,
      payment_method: "MOBILE_MONEY",
      status: 'PENDING',
      reference: \`REF-\${Math.floor(Math.random() * 1000000)}\`
    }).select().single().then(({ data, error }) => {
       if (data) {
          setPayments([...payments, {
            id: data.id,
            schoolId: data.school_id,
            studentId: data.student_id,
            parentId: data.parent_id,
            amount: data.amount,
            date: new Date(data.created_at).getTime(),
            status: data.status,
            reference: data.reference,
            method: data.payment_method
          } as any]);
       }
    });`
);

fs.writeFileSync('src/pages/ParentPayments.tsx', content2);
