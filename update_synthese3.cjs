const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStats.tsx', 'utf8');

// Fix the syntax error manually
code = code.replace(
  /className=\{\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \$\s*\{activeTab === "SYNTHESE_ELEVE" && \(/,
  `className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "SYNTHESE_ELEVE" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Synthèse Élève
          </button>
        </div>
      </div>
      {activeTab === "BILAN_CLASSE" && (
         /* we accidentally deleted BILAN_CLASSE! I need to re-add it */`
);

fs.writeFileSync('src/pages/SchoolAdminStats.tsx', code);
