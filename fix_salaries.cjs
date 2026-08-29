const fs = require('fs');
let code = fs.readFileSync('src/components/CashierSalaries.tsx', 'utf8');

// Replace month with period Start and End in the UI
code = code.replace(
  `                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mois (AAAA-MM)</label>
                  <input required type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>`,
  `                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Période (Début)</label>
                  <input required type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Période (Fin)</label>
                  <input required type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>`
);

// Add deductions
code = code.replace(
  `              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date d'opération</label>`,
  `              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Retenues</label>
                  <select value={deductions} onChange={e => setDeductions(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="Aucun">Aucun</option>
                    <option value="AIB">AIB</option>
                    <option value="CNSS">CNSS</option>
                    <option value="Autres">Autres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date d'opération</label>`
);

// Map employee name dropdown
code = code.replace(
  `                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom de l'employé</label>
                  <input required type="text" placeholder="Ex: Jean Dupont" value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>`,
  `                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom de l'employé</label>
                  <select required value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Sélectionner l'employé...</option>
                    {schoolEmployees.filter(e => {
                       if (employeeRole === "Professeur") return e.role === "TEACHER";
                       if (employeeRole === "Directeur") return e.role === "SCHOOL_ADMIN";
                       if (employeeRole === "Directeur des études") return e.role === "DIRECTOR_OF_STUDIES";
                       if (employeeRole === "Secrétaire") return e.role === "SECRETARY";
                       if (employeeRole === "Caissier") return e.role === "CASHIER";
                       if (employeeRole === "Surveillant") return e.role === "SUPERVISOR";
                       return true;
                    }).map(emp => (
                       <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>`
);

// Show periods instead of month in table
code = code.replace(
  `<div className="flex items-center gap-1"><Calendar size={14} className="text-slate-400"/> {s.month}</div>`,
  `<div className="flex flex-col text-xs gap-0.5"><div className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> {new Date(s.periodStart).toLocaleDateString()}</div><div className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> {new Date(s.periodEnd).toLocaleDateString()}</div></div>`
);

fs.writeFileSync('src/components/CashierSalaries.tsx', code);
