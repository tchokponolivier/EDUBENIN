const fs = require('fs');
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Add state to fetch academic year
const importTarget = `import { useState, useEffect } from 'react';`;
if (!content.includes(importTarget)) {
   content = content.replace(`import React from 'react';`, `import React, { useState, useEffect } from 'react';`);
}

const stateTarget = `const [schoolName, setSchoolName] = useState("");`;
const stateInsert = `const [schoolName, setSchoolName] = useState("");\n  const [academicYear, setAcademicYear] = useState("2025-2026");`;
content = content.replace(stateTarget, stateInsert);

const fetchTarget = `if (data) setSchoolName(data.name);`;
const fetchInsert = `if (data) {
          setSchoolName(data.name);
          if (data.academicYear) setAcademicYear(data.academicYear);
        }`;
content = content.replace(fetchTarget, fetchInsert);

const renderTarget = `<span className="hidden md:inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Année Scolaire 2025-2026</span>`;
const renderInsert = `<span className="hidden md:inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Année Scolaire {academicYear}</span>`;
content = content.replace(renderTarget, renderInsert);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);

let academic = fs.readFileSync('src/components/SchoolAdminAcademic.tsx', 'utf-8');
const handleCreateTarget = `const { error } = await supabase.from('academic_years').insert({
       school_id: user.schoolId,
       name,
       start_date: startDate,
       end_date: endDate,
       status: 'ACTIVE'
    });`;
const handleCreateInsert = `const { error } = await supabase.from('academic_years').insert({
       school_id: user.schoolId,
       name,
       start_date: startDate,
       end_date: endDate,
       status: 'ACTIVE'
    });
    
    if (!error) {
       await supabase.from('schools').update({ academicYear: name }).eq('id', user.schoolId);
    }`;
academic = academic.replace(handleCreateTarget, handleCreateInsert);
fs.writeFileSync('src/components/SchoolAdminAcademic.tsx', academic);

console.log("Patched academic year");
