const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf-8');

const importTarget = `import { SecretaryAbsences } from "../components/SecretaryAbsences";`;
const importInsert = `import { SecretaryAbsences } from "../components/SecretaryAbsences";
import { SupervisorTeacherAbsences } from "../components/SupervisorTeacherAbsences";
import { SupervisorTrips } from "../components/SupervisorTrips";
import { SupervisorMaterials } from "../components/SupervisorMaterials";`;
content = content.replace(importTarget, importInsert);

const targetT = `{activeTab === "TEACHER_ABSENCES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Gestion des présences professeurs</h3>
          <p>Le module de suivi des professeurs sera bientôt disponible.</p>
        </div>
      )}`;
content = content.replace(targetT, `{activeTab === "TEACHER_ABSENCES" && <SupervisorTeacherAbsences />}`);

const targetTR = `{activeTab === "TRIPS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Sorties Pédagogiques</h3>
          <p>La planification des sorties et bus scolaires sera bientôt disponible.</p>
        </div>
      )}`;
content = content.replace(targetTR, `{activeTab === "TRIPS" && <SupervisorTrips />}`);

const targetM = `{activeTab === "MATERIALS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Matériel Pédagogique</h3>
          <p>Le gestionnaire d'inventaire du matériel sera bientôt disponible.</p>
        </div>
      )}`;
content = content.replace(targetM, `{activeTab === "MATERIALS" && <SupervisorMaterials />}`);

fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log("Patched SupervisorDashboard components");
