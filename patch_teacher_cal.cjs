const fs = require('fs');
let content = fs.readFileSync('src/pages/TeacherDashboard.tsx', 'utf-8');

const targetState = `useState<"GRADES" | "ATTENDANCE" | "TIMETABLE">("GRADES");`;
const newState = `useState<"GRADES" | "ATTENDANCE" | "TIMETABLE" | "CALENDAR">("GRADES");`;
content = content.replace(targetState, newState);

const targetBtn = `            Mon Planning
          </button>
        </div>`;
const newBtn = `            Mon Planning
          </button>
          <button 
            onClick={() => setActiveTab("CALENDAR")}
            className={\`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "CALENDAR" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}\`}
          >
            Calendrier
          </button>
        </div>`;
content = content.replace(targetBtn, newBtn);

const targetRender = `{activeTab === "TIMETABLE" && <TeacherTimetable />}`;
const newRender = `{activeTab === "TIMETABLE" && <TeacherTimetable />}
      {activeTab === "CALENDAR" && <SharedCalendar userRole={user?.role || "TEACHER"} />}`;
content = content.replace(targetRender, newRender);

const targetImport = `import { TeacherTimetable } from "../components/TeacherTimetable";`;
const newImport = `import { TeacherTimetable } from "../components/TeacherTimetable";\nimport { SharedCalendar } from "../components/SharedCalendar";`;
content = content.replace(targetImport, newImport);

fs.writeFileSync('src/pages/TeacherDashboard.tsx', content);
console.log("Patched TeacherDashboard");
