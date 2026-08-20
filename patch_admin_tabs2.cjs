const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');

const importTarget = `import { SecretaryTimetables } from "../components/SecretaryTimetables";`;
const importInsert = `import { SecretaryTimetables } from "../components/SecretaryTimetables";
import { SecretaryMails } from "../components/SecretaryMails";
import { SecretaryExams } from "../components/SecretaryExams";
import { SecretaryPlanning } from "../components/SecretaryPlanning";`;
content = content.replace(importTarget, importInsert);

const tabTarget = `      {activeTab === "ABSENCES" && <SecretaryAbsences />}
      {activeTab === "DOCUMENTS" && <SecretaryDocuments />}
      {activeTab === "TIMETABLES" && <SecretaryTimetables />}
    </div>
  );
}`;
const tabInsert = `      {activeTab === "ABSENCES" && <SecretaryAbsences />}
      {activeTab === "DOCUMENTS" && <SecretaryDocuments />}
      {activeTab === "TIMETABLES" && <SecretaryTimetables />}
      {activeTab === "MAILS" && <SecretaryMails />}
      {activeTab === "EXAMS" && <SecretaryExams />}
      {activeTab === "PLANNING" && <SecretaryPlanning />}
    </div>
  );
}`;
content = content.replace(tabTarget, tabInsert);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', content);
console.log("Patched admin tabs 2");
