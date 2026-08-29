const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf8');

code = code.replace(
  `  const filteredPayments = payments.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    if (!student) return false;
    const nameStr = \`\${student.firstName} \${student.lastName}\`.toLowerCase();
    return nameStr.includes(searchTerm.toLowerCase()) || p.reference.toLowerCase().includes(searchTerm.toLowerCase());
  });`,
  `  const filteredPayments = payments.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    if (!student) return false;
    const nameStr = \`\${student.firstName} \${student.lastName}\`.toLowerCase();
    const matchSearch = nameStr.includes(searchTerm.toLowerCase()) || p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Fallbacks since we don't have year or type explicitly on payment for now, 
    // but we might have them in the items.
    // For type: check if any item name matches or if 'ALL'
    let matchType = true;
    if (filterType !== "ALL") {
       matchType = p.items?.some(i => i.name.toLowerCase().includes(filterType.toLowerCase())) || false;
       if (!p.items?.length && filterType === "Scolarité") matchType = true; // Default payments are usually scolarité
    }
    
    // For class
    let matchClass = true;
    if (filterClass !== "ALL") {
       matchClass = student.level === filterClass;
    }
    
    return matchSearch && matchType && matchClass;
  });`
);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', code);
