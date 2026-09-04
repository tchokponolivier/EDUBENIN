const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf8');

// Add react-router-dom import if not present
if (!code.includes('useLocation')) {
    code = code.replace(
        `import { useAuth } from "../lib/auth";`,
        `import { useAuth } from "../lib/auth";\nimport { useLocation } from "react-router-dom";`
    );
}

// Add location reading
code = code.replace(
  `const { user } = useAuth();`,
  `const { user } = useAuth();
  const location = useLocation();`
);

code = code.replace(
  `useEffect(() => {
    fetchDashboardData();`,
  `useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ["DASHBOARD", "MEMBERS", "ANNOUNCEMENTS", "SETTINGS", "ACADEMIC", "FEES"].includes(tabParam)) {
       setActiveTab(tabParam as any);
    }
  }, [location]);

  useEffect(() => {
    fetchDashboardData();`
);

// Remove the SETTINGS button from the Dashboard tabs
code = code.replace(
  `<button 
            onClick={() => setActiveTab("SETTINGS")}
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "SETTINGS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            <span className="flex items-center gap-2"><Settings size={14} /> Paramètres</span>
          </button>`,
  ``
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', code);
