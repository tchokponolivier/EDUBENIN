import fs from 'fs';
let content = fs.readFileSync('src/components/CashierDashboard.tsx', 'utf-8');

content = content.replace(
  '<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">',
  '<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">'
);

content = content.replace(
  '<BarChart data={data}>',
  '<BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>'
);

fs.writeFileSync('src/components/CashierDashboard.tsx', content);
