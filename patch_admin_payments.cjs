const fs = require('fs');

let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

// 1. Import CashierVerification
if (!content.includes('CashierVerification')) {
   content = content.replace(
      'import { CashierSalaries } from "../components/CashierSalaries";',
      `import { CashierSalaries } from "../components/CashierSalaries";\nimport { CashierVerification } from "../components/CashierVerification";`
   );
}

// 2. Add tab state VERIFICATION
content = content.replace(
   /const \[activeTab, setActiveTab\] = useState<"INSCRIPTIONS" \| "PAYMENTS" \| "EXPENSES" \| "SALARIES" \| "DASHBOARD">/,
   `const [activeTab, setActiveTab] = useState<"INSCRIPTIONS" | "PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD" | "VERIFICATION">`
);

// 3. Add tab button
const btnSearch = `<button 
            onClick={() => setActiveTab("PAYMENTS")}`;
            
const btnReplace = `<button 
            onClick={() => setActiveTab("VERIFICATION")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "VERIFICATION" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Vérifications
          </button>
          ` + btnSearch;
          
content = content.replace(btnSearch, btnReplace);

// 4. Add the component render
const renderSearch = `{activeTab === "EXPENSES" && <CashierExpenses />}`;
const renderReplace = `{activeTab === "VERIFICATION" && <CashierVerification />}\n      ` + renderSearch;
content = content.replace(renderSearch, renderReplace);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
