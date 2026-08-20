const fs = require('fs');
let content = fs.readFileSync('src/pages/DirectorDashboard.tsx', 'utf-8');

const targetBtn = `            Orientation & Sanctions
          </button>`;
const newBtn = `            Orientation & Sanctions
          </button>
          <button
            onClick={() => setActiveTab("CALENDAR")}
            className={\`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap \${activeTab === "CALENDAR" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}\`}
          >
            Calendrier
          </button>`;

content = content.replace(targetBtn, newBtn);

const targetRender = `{activeTab === "ORIENTATION" && <DirectorOrientation />}`;
const newRender = `{activeTab === "ORIENTATION" && <DirectorOrientation />}
          {activeTab === "CALENDAR" && <SharedCalendar userRole={user?.role || "DIRECTOR_OF_STUDIES"} />}`;

content = content.replace(targetRender, newRender);

const targetImport = `import { DirectorOrientation } from "../components/director/DirectorOrientation";`;
const newImport = `import { DirectorOrientation } from "../components/director/DirectorOrientation";\nimport { SharedCalendar } from "../components/SharedCalendar";`;

content = content.replace(targetImport, newImport);

fs.writeFileSync('src/pages/DirectorDashboard.tsx', content);
console.log("Patched DirectorDashboard");
