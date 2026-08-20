const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');

const target1 = `  const [activeTab, setActiveTab] = useState<"STUDENTS" | "ABSENCES" | "DOCUMENTS" | "TIMETABLES">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === "STUDENTS" || tab === "ABSENCES" || tab === "DOCUMENTS" || tab === "TIMETABLES") return tab;
    return "STUDENTS";
  });
  
  // Sync state if URL changes
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === "STUDENTS" || tab === "ABSENCES" || tab === "DOCUMENTS" || tab === "TIMETABLES") setActiveTab(tab);
  }, [location.search]);`;

const insert1 = `  const [activeTab, setActiveTab] = useState<"STUDENTS" | "ABSENCES" | "DOCUMENTS" | "TIMETABLES" | "MAILS" | "EXAMS" | "PLANNING">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (["STUDENTS", "ABSENCES", "DOCUMENTS", "TIMETABLES", "MAILS", "EXAMS", "PLANNING"].includes(tab)) return tab;
    return "STUDENTS";
  });
  
  // Sync state if URL changes
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (["STUDENTS", "ABSENCES", "DOCUMENTS", "TIMETABLES", "MAILS", "EXAMS", "PLANNING"].includes(tab)) setActiveTab(tab);
  }, [location.search]);`;
content = content.replace(target1, insert1);

const target2 = `      {activeTab === "TIMETABLE" && <SecretaryTimetables />}
    </div>
  );
}`;
// Wait, is it "TIMETABLES"? In the file it might be `activeTab === "TIMETABLES" && <SecretaryTimetables />`. Let's check exactly.
