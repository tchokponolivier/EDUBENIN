import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

if (!content.includes('CashierSalaries')) {
  // Add import
  content = content.replace(
    `import { CashierDashboard } from "../components/CashierDashboard";`,
    `import { CashierDashboard } from "../components/CashierDashboard";\nimport { CashierSalaries } from "../components/CashierSalaries";`
  );

  // Update activeTab type
  content = content.replace(
    `useState<"PAYMENTS" | "EXPENSES" | "DASHBOARD">("PAYMENTS");`,
    `useState<"PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD">("PAYMENTS");`
  );

  // Add tab button
  content = content.replace(
    `<button 
            onClick={() => setActiveTab("EXPENSES")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "EXPENSES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Dépenses
          </button>`,
    `<button 
            onClick={() => setActiveTab("EXPENSES")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "EXPENSES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Dépenses
          </button>
          <button 
            onClick={() => setActiveTab("SALARIES")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "SALARIES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Salaires
          </button>`
  );

  // Add component render
  content = content.replace(
    `{activeTab === "EXPENSES" && <CashierExpenses />}`,
    `{activeTab === "EXPENSES" && <CashierExpenses />}\n      {activeTab === "SALARIES" && <CashierSalaries />}`
  );

  fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
}
