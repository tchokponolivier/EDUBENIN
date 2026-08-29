const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolAdminFees.tsx', 'utf8');

code = code.replace(
  `const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('fee_config').insert({
       school_id: user.schoolId,
       level,
       fee_type: feeType,
       amount: Number(amount)
    });`,
  `const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    let error;
    if (editingId) {
       const res = await supabase.from('fee_config').update({
         level,
         fee_type: feeType,
         amount: Number(amount)
       }).eq('id', editingId);
       error = res.error;
    } else {
       const res = await supabase.from('fee_config').insert({
         school_id: user.schoolId,
         level,
         fee_type: feeType,
         amount: Number(amount)
       });
       error = res.error;
    }`
);

code = code.replace(
  `setShowForm(false);
       setAmount("");`,
  `setShowForm(false);
       setAmount("");
       setEditingId(null);`
);

code = code.replace(
  `onClick={() => setShowForm(!showForm)}`,
  `onClick={() => { setShowForm(!showForm); setEditingId(null); }}`
);

code = code.replace(
  `handleDelete(fee.id); // Delete old one so we can save new`,
  `setEditingId(fee.id);`
);

fs.writeFileSync('src/components/SchoolAdminFees.tsx', code);
