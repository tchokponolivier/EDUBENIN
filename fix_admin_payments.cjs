const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf8');

code = code.replace(
  `          <button 
            onClick={() => setActiveTab("INSCRIPTIONS")}
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "INSCRIPTIONS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Inscriptions
          </button>`,
  ``
);

code = code.replace(
  `{activeTab === "INSCRIPTIONS" && <CashierEnrollment />}`,
  ``
);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', code);
