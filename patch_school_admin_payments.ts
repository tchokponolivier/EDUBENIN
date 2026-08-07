import fs from 'fs';

let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

content = content.replace(/import \{ db \} from "\.\.\/lib\/db";\n/g, '');

content = content.replace(
`  useEffect(() => {
    fetchPayments();
  }, [user]);`,
`  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    fetchPayments();
    if (user?.schoolId) {
      supabase.from('schools').select('*').eq('id', user.schoolId).single().then(({data}) => {
         if (data) setSchoolSettings(data);
      });
    }
  }, [user]);`
);

content = content.replace(
`    const newPayment = db.addPayment({
      schoolId: user.schoolId,
      studentId: newPaymentStudent,
      parentId: parent?.id || "",
      amount: Number(newPaymentAmount),
      method: newPaymentMethod
    });
    
    setPayments([...payments, newPayment]);`,
`    const { data, error } = await supabase.from('payments').insert({
      school_id: user.schoolId,
      student_id: newPaymentStudent,
      parent_id: parent?.id || "00000000-0000-0000-0000-000000000000",
      amount: Number(newPaymentAmount),
      payment_method: newPaymentMethod,
      status: 'COMPLETED',
      reference: \`REF-\${Math.floor(Math.random() * 1000000)}\`
    }).select().single();
    
    if (data && !error) {
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
    } else {
       alert("Erreur lors de l'enregistrement du paiement");
    }
`
);

content = content.replace(
`const settings = db.getSchoolSettings();`,
`const settings = schoolSettings;`
);

content = content.replace(
`const settings = db.getSchoolSettings();`,
`const settings = schoolSettings;`
);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
