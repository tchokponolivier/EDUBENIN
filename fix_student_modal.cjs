const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf8');

code = code.replace(
  `      {activeTab === "DOCUMENTS" && <SecretaryDocuments />}
      {activeTab === "TIMETABLES" && <SecretaryTimetables />}
    </div>
  );
}`,
  `      {activeTab === "DOCUMENTS" && <SecretaryDocuments />}
      {activeTab === "TIMETABLES" && <SecretaryTimetables />}
      {showAddStudentModal && <AddStudentModal onClose={() => { setShowAddStudentModal(false); window.location.reload(); }} />}
    </div>
  );
}`
);

fs.writeFileSync('src/pages/SchoolAdminStudents.tsx', code);
