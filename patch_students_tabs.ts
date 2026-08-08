import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf-8');

// Add useLocation
if (!content.includes('useLocation')) {
  content = content.replace(
    `import { Search, Filter, Download, Plus, Mail, CheckCircle, X, History, FileText, Printer, Trash2 } from "lucide-react";`,
    `import { Search, Filter, Download, Plus, Mail, CheckCircle, X, History, FileText, Printer, Trash2 } from "lucide-react";\nimport { useLocation } from "react-router-dom";`
  );
}

// Update useState for activeTab
content = content.replace(
  `const [activeTab, setActiveTab] = useState<"STUDENTS" | "ABSENCES" | "DOCUMENTS" | "TIMETABLES">("STUDENTS");`,
  `const location = useLocation();\n  const [activeTab, setActiveTab] = useState<"STUDENTS" | "ABSENCES" | "DOCUMENTS" | "TIMETABLES">(() => {\n    const params = new URLSearchParams(location.search);\n    const tab = params.get('tab');\n    if (tab === "STUDENTS" || tab === "ABSENCES" || tab === "DOCUMENTS" || tab === "TIMETABLES") return tab;\n    return "STUDENTS";\n  });\n  \n  // Sync state if URL changes\n  React.useEffect(() => {\n    const params = new URLSearchParams(location.search);\n    const tab = params.get('tab');\n    if (tab === "STUDENTS" || tab === "ABSENCES" || tab === "DOCUMENTS" || tab === "TIMETABLES") setActiveTab(tab);\n  }, [location.search]);`
);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', content);
