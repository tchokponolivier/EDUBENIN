const fs = require('fs');
let content = fs.readFileSync('src/components/CashierSalaries.tsx', 'utf-8');

// Add states
const stateTarget = `const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [status, setStatus] = useState("PAYÉ");`;
const stateInsert = `const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [deductions, setDeductions] = useState("Aucun");
  const [status, setStatus] = useState("PAYÉ");
  const [schoolEmployees, setSchoolEmployees] = useState<any[]>([]);`;
content = content.replace(stateTarget, stateInsert);

// Add Salary types
const typeTarget = `month: string;`;
const typeInsert = `periodStart: string;
  periodEnd: string;
  deductions: string;`;
content = content.replace(typeTarget, typeInsert);

// Fetch employees
const fetchTarget = `fetchSalaries();
  }, [user?.schoolId]);`;
const fetchInsert = `fetchSalaries();
    fetchEmployees();
  }, [user?.schoolId]);

  const fetchEmployees = async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('profiles').select('*').eq('school_id', user.schoolId);
    if (data) setSchoolEmployees(data);
  };`;
content = content.replace(fetchTarget, fetchInsert);

// Fix mapped salary data in fetchSalaries
const mapTarget = `month: d.month,`;
const mapInsert = `periodStart: d.period_start || d.month,
          periodEnd: d.period_end || "",
          deductions: d.deductions || "Aucun",`;
content = content.replace(mapTarget, mapInsert);

// Form Fields
const formTarget = `<div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employé</label>
                <input required value={employeeName} onChange={e => setEmployeeName(e.target.value)} type="text" className="w-full px-3 py-2 border rounded text-sm" placeholder="Nom et Prénoms" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fonction</label>
                <select required value={employeeRole} onChange={e => setEmployeeRole(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>`;

const formInsert = `<div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fonction</label>
                <select required value={employeeRole} onChange={e => {
                   setEmployeeRole(e.target.value);
                   setEmployeeName(""); // reset employee
                }} className="w-full px-3 py-2 border rounded text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employé</label>
                {["Directeur", "Directeur des études", "Secrétaire", "Surveillant", "Professeur", "Caisse"].includes(employeeRole) ? (
                   <select required value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                      <option value="">Sélectionnez un employé</option>
                      {schoolEmployees.map(emp => (
                         <option key={emp.id} value={emp.full_name || emp.email}>{emp.full_name || emp.email}</option>
                      ))}
                   </select>
                ) : (
                   <input required value={employeeName} onChange={e => setEmployeeName(e.target.value)} type="text" className="w-full px-3 py-2 border rounded text-sm" placeholder="Nom et Prénoms" />
                )}
              </div>`;
content = content.replace(formTarget, formInsert);

// Replace "Mois" with "Période"
const monthTarget = `<div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mois Concerné</label>
                <input required value={month} onChange={e => setMonth(e.target.value)} type="month" className="w-full px-3 py-2 border rounded text-sm" />
              </div>`;
const monthInsert = `<div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Période (Début)</label>
                <input required value={periodStart} onChange={e => setPeriodStart(e.target.value)} type="date" className="w-full px-3 py-2 border rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Période (Fin)</label>
                <input required value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} type="date" className="w-full px-3 py-2 border rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Retenues</label>
                <select required value={deductions} onChange={e => setDeductions(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
                  <option value="Aucun">Aucun</option>
                  <option value="AIB">AIB</option>
                  <option value="CNSS">CNSS</option>
                  <option value="Autres">Autres</option>
                </select>
              </div>`;
content = content.replace(monthTarget, monthInsert);

const savePayloadTarget = `month,`;
const savePayloadInsert = `period_start: periodStart,
        period_end: periodEnd,
        deductions,`;
content = content.replace(savePayloadTarget, savePayloadInsert);

const tableMoisTarget = `<th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mois</th>`;
const tableMoisInsert = `<th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Période</th>
<th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Retenues</th>`;
content = content.replace(tableMoisTarget, tableMoisInsert);

const renderMonthTarget = `<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                      {new Date(salary.month + "-01").toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </td>`;
const renderMonthInsert = `<td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                      {salary.periodStart} au {salary.periodEnd}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                      {salary.deductions}
                    </td>`;
content = content.replace(renderMonthTarget, renderMonthInsert);

fs.writeFileSync('src/components/CashierSalaries.tsx', content);
console.log("Patched Salaries");
