const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

// Fix payment mapping
const fetchTarget = `setPayments(paymentsRes.data.map(d => ({...d, studentId: d.student_id, schoolId: d.school_id, parentId: d.parent_id, createdAt: d.created_at})) as any);`;
const fetchInsert = `setPayments(paymentsRes.data.map(d => ({
          ...d, 
          studentId: d.student_id, 
          schoolId: d.school_id, 
          parentId: d.parent_id, 
          createdAt: d.created_at,
          date: d.payment_date ? new Date(d.payment_date).getTime() : new Date(d.created_at).getTime(),
          items: d.items || []
        })) as any);`;
content = content.replace(fetchTarget, fetchInsert);

// Add filter states
const stateTarget = `const [searchTerm, setSearchTerm] = useState("");`;
const stateInsert = `const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");`;
content = content.replace(stateTarget, stateInsert);

// Apply filters
const filterTarget = `const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const student = students.find(s => s.id === payment.studentId);
      const studentName = student ? \`\${student.firstName} \${student.lastName}\`.toLowerCase() : "";
      return payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) || studentName.includes(searchTerm.toLowerCase());
    }).sort((a, b) => b.date - a.date);
  }, [payments, students, searchTerm]);`;

const filterInsert = `const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const student = students.find(s => s.id === payment.studentId);
      const studentName = student ? \`\${student.firstName} \${student.lastName}\`.toLowerCase() : "";
      
      const matchSearch = payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) || studentName.includes(searchTerm.toLowerCase());
      
      let matchClass = true;
      if (filterClass !== "ALL" && student) {
         matchClass = student.level === filterClass;
      }
      
      let matchYear = true;
      if (filterYear !== "ALL") {
         const pYear = new Date(payment.date).getFullYear();
         const is24_25 = pYear === 2024 || (pYear === 2025 && new Date(payment.date).getMonth() < 8);
         if (filterYear === "2024-2025" && !is24_25) matchYear = false;
         if (filterYear === "2023-2024" && is24_25) matchYear = false; // simplistic
      }
      
      let matchType = true;
      if (filterType !== "ALL" && payment.items) {
         matchType = payment.items.some((i: any) => i.name && i.name.toLowerCase().includes(filterType.toLowerCase()));
      }
      
      return matchSearch && matchClass && matchYear && matchType;
    }).sort((a, b) => b.date - a.date);
  }, [payments, students, searchTerm, filterClass, filterYear, filterType]);`;
content = content.replace(filterTarget, filterInsert);

// Add filter UI
const searchUITarget = `<div className="relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Rechercher (réf ou élève)..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none w-64"
             />
           </div>`;

const searchUIInsert = `<div className="flex flex-wrap items-center gap-2">
             <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Toutes les années</option>
               <option value="2024-2025">2024-2025</option>
               <option value="2023-2024">2023-2024</option>
             </select>
             <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Tous les types</option>
               <option value="Scolarité">Scolarité</option>
               <option value="Inscription">Inscription</option>
               <option value="Cantine">Cantine</option>
             </select>
             <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 outline-none">
               <option value="ALL">Toutes les classes</option>
               <option value="6ème">6ème</option>
               <option value="5ème">5ème</option>
               <option value="4ème">4ème</option>
               <option value="3ème">3ème</option>
             </select>
             <div className="relative">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Recherche..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none w-48"
               />
             </div>
           </div>`;
content = content.replace(searchUITarget, searchUIInsert);

// Fix date rendering to avoid Invalid Date
const dateRenderTarget = `{new Date(payment.date).toLocaleDateString()}`;
const dateRenderInsert = `{payment.date && !isNaN(new Date(payment.date).getTime()) ? new Date(payment.date).toLocaleDateString() : '-'}`;
content = content.replace(dateRenderTarget, dateRenderInsert);
// second one in receipt
content = content.replace(dateRenderTarget, dateRenderInsert);
// third one in receipt
content = content.replace(`{new Date(payment.date).toLocaleDateString()}`, `{payment.date && !isNaN(new Date(payment.date).getTime()) ? new Date(payment.date).toLocaleDateString() : '-'}`);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
console.log("Patched Payments List Filters");
