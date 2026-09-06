const fs = require('fs');
let code = fs.readFileSync('src/components/CashierDashboard.tsx', 'utf8');

const stateTarget = `const [loading, setLoading] = useState(true);`;
const stateReplacement = `const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("ALL");`;

const fetchTarget = `const [paymentsRes, expensesRes] = await Promise.all([
        supabase.from('payments').select('*').eq('school_id', user.schoolId),
        supabase.from('expenses').select('*').eq('school_id', user.schoolId)
      ]);`;
const fetchReplacement = `const [paymentsRes, expensesRes, yearsRes] = await Promise.all([
        supabase.from('payments').select('*').eq('school_id', user.schoolId),
        supabase.from('expenses').select('*').eq('school_id', user.schoolId),
        supabase.from('academic_years').select('*').eq('school_id', user.schoolId)
      ]);
      
      if (yearsRes.data) {
          setAcademicYears(yearsRes.data);
      }`;

const memoTarget = `const stats = useMemo(() => {
    const totalRecettes = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);`;
const memoReplacement = `const filteredPayments = useMemo(() => {
      if (selectedYearId === "ALL") return payments;
      const year = academicYears.find(y => y.id === selectedYearId);
      if (!year) return payments;
      const start = new Date(year.start_date).getTime();
      const end = new Date(year.end_date).getTime();
      return payments.filter(p => p.date >= start && p.date <= end);
  }, [payments, selectedYearId, academicYears]);

  const filteredExpenses = useMemo(() => {
      if (selectedYearId === "ALL") return expenses;
      const year = academicYears.find(y => y.id === selectedYearId);
      if (!year) return expenses;
      const start = new Date(year.start_date).getTime();
      const end = new Date(year.end_date).getTime();
      return expenses.filter(e => {
         const t = new Date(e.expenseDate).getTime();
         return t >= start && t <= end;
      });
  }, [expenses, selectedYearId, academicYears]);

  const stats = useMemo(() => {
    const totalRecettes = filteredPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);`;

const memoTarget2 = `const totalDepenses = expenses.reduce((sum, e) => sum + e.amount, 0);`;
const memoReplacement2 = `const totalDepenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);`;

const chartTarget = `const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string, recettes: number, depenses: number }> = {};
    
    payments.filter(p => p.status === 'COMPLETED').forEach(p => {`;
const chartReplacement = `const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string, recettes: number, depenses: number }> = {};
    
    filteredPayments.filter(p => p.status === 'COMPLETED').forEach(p => {`;

const chartTarget2 = `expenses.forEach(e => {`;
const chartReplacement2 = `filteredExpenses.forEach(e => {`;

const uiTarget = `return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">`;
const uiReplacement = `return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <h2 className="text-lg font-bold text-gray-800">Tableau de Bord Financier</h2>
         <div className="flex items-center gap-2">
           <label className="text-xs font-semibold text-gray-600 uppercase">Année Scolaire</label>
           <select 
              value={selectedYearId} 
              onChange={e => setSelectedYearId(e.target.value)}
              className="text-sm px-3 py-1.5 border border-slate-300 rounded focus:ring-emerald-500 outline-none bg-emerald-50 text-emerald-800 font-bold"
           >
              <option value="ALL">Toutes les années</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
           </select>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">`;

if (code.includes(stateTarget) && code.includes(uiTarget)) {
  code = code.replace(stateTarget, stateReplacement);
  code = code.replace(fetchTarget, fetchReplacement);
  code = code.replace(memoTarget, memoReplacement);
  code = code.replace(memoTarget2, memoReplacement2);
  code = code.replace(chartTarget, chartReplacement);
  code = code.replace(chartTarget2, chartReplacement2);
  code = code.replace(uiTarget, uiReplacement);
  fs.writeFileSync('src/components/CashierDashboard.tsx', code);
  console.log("CashierDashboard Patched successfully");
} else {
  console.log("Target not found!");
}
