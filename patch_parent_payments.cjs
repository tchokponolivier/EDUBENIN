const fs = require('fs');
let content = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');

const filterStateTarget = `  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');`;
const filterStateInsert = `  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [filterStudentId, setFilterStudentId] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");`;

content = content.replace(filterStateTarget, filterStateInsert);

const filterLogicTarget = `  useEffect(() => {
    const now = new Date();
    
    const filtered = allPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      switch(dateFilter) {
        case 'DAY': return paymentDate.toDateString() === now.toDateString();
        case 'WEEK': {
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          return paymentDate >= firstDay && paymentDate <= lastDay;
        }
        case 'MONTH': return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
        case 'YEAR': return paymentDate.getFullYear() === now.getFullYear();
        default: return true;
      }
    });
    setFilteredPayments(filtered);
  }, [allPayments, dateFilter]);`;

const filterLogicInsert = `  useEffect(() => {
    const now = new Date();
    
    const filtered = allPayments.filter(payment => {
      const paymentDate = new Date(payment.date);
      
      let passDate = true;
      switch(dateFilter) {
        case 'DAY': passDate = (paymentDate.toDateString() === now.toDateString()); break;
        case 'WEEK': {
          const firstDay = new Date(now.getTime() - now.getDay() * 24*60*60*1000);
          const lastDay = new Date(firstDay.getTime() + 6 * 24*60*60*1000);
          passDate = paymentDate >= firstDay && paymentDate <= lastDay; break;
        }
        case 'MONTH': passDate = (paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()); break;
        case 'YEAR': passDate = (paymentDate.getFullYear() === now.getFullYear()); break;
      }
      
      let passStudent = filterStudentId === "ALL" || payment.studentId === filterStudentId;
      let passYear = filterYear === "ALL" || paymentDate.getFullYear().toString() === filterYear;
      
      return passDate && passStudent && passYear;
    });
    setFilteredPayments(filtered);
  }, [allPayments, dateFilter, filterStudentId, filterYear]);`;

content = content.replace(filterLogicTarget, filterLogicInsert);

const uiFilterTarget = `            <div className="flex p-1 bg-slate-100 rounded overflow-x-auto">
               <button onClick={() => setDateFilter('ALL')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'ALL' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Tous</button>
               <button onClick={() => setDateFilter('DAY')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'DAY' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Jour</button>
               <button onClick={() => setDateFilter('WEEK')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'WEEK' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Sem</button>
               <button onClick={() => setDateFilter('MONTH')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'MONTH' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Mois</button>
               <button onClick={() => setDateFilter('YEAR')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'YEAR' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>An</button>
            </div>`;

const uiFilterInsert = `            <div className="flex gap-2 items-center flex-wrap">
              <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs text-gray-700 outline-none">
                <option value="ALL">Tous les enfants</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-xs text-gray-700 outline-none">
                <option value="ALL">Toutes les années</option>
                {Array.from(new Set(allPayments.map(p => new Date(p.date).getFullYear()))).sort().reverse().map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
              <div className="flex p-1 bg-slate-100 rounded overflow-x-auto">
                 <button onClick={() => setDateFilter('ALL')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'ALL' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Tous</button>
                 <button onClick={() => setDateFilter('DAY')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'DAY' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Jour</button>
                 <button onClick={() => setDateFilter('WEEK')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'WEEK' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Sem</button>
                 <button onClick={() => setDateFilter('MONTH')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'MONTH' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>Mois</button>
                 <button onClick={() => setDateFilter('YEAR')} className={\`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors \${dateFilter === 'YEAR' ? 'bg-white shadow-sm text-gray-700' : 'text-slate-500 hover:text-gray-700'}\`}>An</button>
              </div>
            </div>`;

content = content.replace(uiFilterTarget, uiFilterInsert);

const nameTarget = `const childName = children.find(c => c.id === payment.studentId)?.firstName || "Inconnu";`;
const nameInsert = `const child = children.find(c => c.id === payment.studentId);
const childName = child ? \`\${child.lastName} \${child.firstName}\` : "Inconnu";`;

content = content.replace(/const childName = children\.find\(c => c\.id === payment\.studentId\)\?\.firstName \|\| "Inconnu";/g, nameInsert);

fs.writeFileSync('src/pages/ParentPayments.tsx', content);
console.log("Patched ParentPayments filter and name");
