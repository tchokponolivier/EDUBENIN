import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf-8');

if (!content.includes('AddStudentModal')) {
  content = content.replace(
    'import { Users, Search, Filter, BookOpen, GraduationCap } from "lucide-react";',
    'import { Users, Search, Filter, BookOpen, GraduationCap, Plus } from "lucide-react";\nimport { AddStudentModal } from "../components/AddStudentModal";'
  );

  content = content.replace(
    'const [selectedClass, setSelectedClass] = useState<string>("ALL");',
    'const [selectedClass, setSelectedClass] = useState<string>("ALL");\n  const [showAddModal, setShowAddModal] = useState(false);'
  );

  content = content.replace(
    '</div>\n      </div>\n\n      <div className="bg-white p-4',
    '</div>\n        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm">\n          <Plus size={16} /> Inscrire un élève\n        </button>\n      </div>\n\n      <div className="bg-white p-4'
  );

  content = content.replace(
    '    </div>\n  );\n}\n\nfunction ClassSection',
    '      <AddStudentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />\n    </div>\n  );\n}\n\nfunction ClassSection'
  );

  fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', content);
}
