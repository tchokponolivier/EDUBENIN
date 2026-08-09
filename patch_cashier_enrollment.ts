import fs from 'fs';

let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

// Add import
content = content.replace(
  'import { CashierDashboard } from "../components/CashierDashboard";',
  'import { CashierDashboard } from "../components/CashierDashboard";\nimport { CashierEnrollment } from "../components/CashierEnrollment";'
);

// Update activeTab type
content = content.replace(
  'const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD">',
  'const [activeTab, setActiveTab] = useState<"INSCRIPTIONS" | "PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD">'
);

// Add tab button
const tabButtons = `<button 
            onClick={() => setActiveTab("INSCRIPTIONS")} 
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "INSCRIPTIONS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Inscriptions
          </button>
          <button 
            onClick={() => setActiveTab("PAYMENTS")} 
`;
content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\("PAYMENTS"\)\}/,
  tabButtons
);

// Add tab view
const tabViews = `{activeTab === "INSCRIPTIONS" && <CashierEnrollment />}
      {activeTab === "PAYMENTS" && (`;
content = content.replace(
  /\{activeTab === "PAYMENTS" && \(/g,
  (match, offset, str) => {
    // Only replace the main content block, not the button condition
    if (str.substring(offset - 20, offset).includes('<button')) return match;
    if (str.substring(offset - 40, offset).includes('{activeTab === "PAYMENTS" && (')) return match;
    return tabViews; // Wait, better string matching needed.
  }
);
fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
