import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminTeachers.tsx', 'utf-8');

if (!content.includes('AddTeacherModal')) {
  content = content.replace(
    'import { User, Calculator, BookOpen, Clock, Banknote, Calendar } from "lucide-react";',
    'import { User, Calculator, BookOpen, Clock, Banknote, Calendar, Plus } from "lucide-react";\nimport { AddTeacherModal } from "../components/AddTeacherModal";'
  );

  content = content.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [showAddModal, setShowAddModal] = useState(false);'
  );

  content = content.replace(
    '</div>\n      </div>\n\n      {loading ? (',
    '</div>\n        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded font-bold uppercase tracking-wider text-xs hover:bg-emerald-700 transition shadow-sm">\n          <Plus size={16} /> Inscrire un professeur\n        </button>\n      </div>\n\n      {loading ? ('
  );

  content = content.replace(
    '    </div>\n  );\n}',
    '      <AddTeacherModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchData} />\n    </div>\n  );\n}'
  );

  fs.writeFileSync('src/pages/SchoolAdminTeachers.tsx', content);
}
