const fs = require('fs');

let adminContent = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

adminContent = adminContent.replace(
/const handleAddAnnouncement = \(e: React\.FormEvent\) => \{[\s\S]*?setAnnouncementContent\(""\);\s*\};/m,
`const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('announcements').insert({
      school_id: user?.schoolId,
      title: announcementTitle,
      content: announcementContent,
      author_name: user?.name || "Administration"
    }).select().single();
    if (!error && data) {
      setAnnouncements(prev => [{
        id: data.id,
        title: data.title,
        content: data.content,
        authorName: data.author_name,
        date: new Date(data.created_at).getTime()
      }, ...prev]);
      setAnnouncementTitle("");
      setAnnouncementContent("");
    }
  };`
);

adminContent = adminContent.replace(
/const handleDeleteAnnouncement = \(id: string\) => \{[\s\S]*?\}\s*\};/m,
`const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (!error) {
         setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    }
  };`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', adminContent);

let paymentsContent = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf8');
paymentsContent = paymentsContent.replace(
/const handleCreatePayment = \(e: React\.FormEvent\) => \{[\s\S]*?setNewPaymentMethod\("CASH"\);\s*\};/m,
`const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId || !newPaymentStudent) return;
    const parent = students.find(s => s.id === newPaymentStudent);
    const { data, error } = await supabase.from('payments').insert({
      school_id: user.schoolId,
      student_id: newPaymentStudent,
      parent_id: parent?.parentId || "00000000-0000-0000-0000-000000000000",
      amount: Number(newPaymentAmount),
      payment_method: newPaymentMethod,
      status: 'COMPLETED',
      reference: \`REF-\${Math.floor(Math.random() * 1000000)}\`
    }).select().single();
    if (!error && data) {
       setPayments(prev => [{
         id: data.id,
         schoolId: data.school_id,
         studentId: data.student_id,
         parentId: data.parent_id,
         amount: data.amount,
         date: new Date(data.created_at).getTime(),
         status: data.status,
         reference: data.reference,
         method: data.payment_method
       } as any, ...prev]);
       setShowNewPayment(false);
       setNewPaymentStudent("");
       setNewPaymentAmount("");
       setNewPaymentMethod("CASH");
    }
  };`
);
fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', paymentsContent);

let parentContent = fs.readFileSync('src/pages/Parent.tsx', 'utf8');
parentContent = parentContent.replace(
/const handleAddChildSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?setShowAddChild\(false\);\s*\};/m,
`const handleAddChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChildId) {
      await supabase.from('students').update({
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        level: studentData.level,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        address: studentData.address,
        medical_info: studentData.medicalInfo
      }).eq('id', editingChildId);
    } else {
      await supabase.from('students').insert({
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
      });
    }
    setShowAddChild(false);
    fetchData(); // reload
  };`
);
parentContent = parentContent.replace(
/const handleSpecialRequestSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?alert\("Demande envoyée"\);\s*\};/m,
`const handleSpecialRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChildForAttendance) {
       await supabase.from('special_requests').insert({
           school_id: user?.schoolId,
           student_id: selectedChildForAttendance.id,
           parent_id: user?.id,
           subject: specialRequestSubject,
           message: specialRequestMessage
       });
       alert("Demande envoyée");
       setSpecialRequestSubject("");
       setSpecialRequestMessage("");
    }
  };`
);
fs.writeFileSync('src/pages/Parent.tsx', parentContent);

let parentPaymentsContent = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf8');
parentPaymentsContent = parentPaymentsContent.replace(
/const handleSimulatePayment = \(\) => \{[\s\S]*?alert\("Paiement Mobile Money initié avec succès\!"\);\s*\};/m,
`const handleSimulatePayment = async () => {
    const { data, error } = await supabase.from('payments').insert({
      school_id: user?.schoolId,
      student_id: selectedChildId,
      parent_id: user?.id,
      amount: paymentAmount,
      payment_method: "MOBILE_MONEY",
      status: 'COMPLETED',
      reference: \`REF-\${Math.floor(Math.random() * 1000000)}\`
    }).select().single();
    if (data && !error) {
       setPayments(prev => [...prev, {
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
       setShowPaymentModal(false);
       alert("Paiement Mobile Money initié avec succès!");
    }
  };`
);
fs.writeFileSync('src/pages/ParentPayments.tsx', parentPaymentsContent);

