const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf8');

code = code.replace(
  `            Emplois du temps
          </button>
        </div>
      {activeTab === "STUDENTS" && (`,
  `            Emplois du temps
          </button>
        </div>
      </div>
      {activeTab === "STUDENTS" && (`
);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', code);
