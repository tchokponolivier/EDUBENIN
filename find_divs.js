const fs = require('fs');
const lines = fs.readFileSync('src/pages/SchoolAdminStudents.tsx', 'utf8').split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const openCount = (lines[i].match(/<div/g) || []).length;
  const closeCount = (lines[i].match(/<\/div>/g) || []).length;
  depth += openCount - closeCount;
  if (openCount !== closeCount) {
    console.log(`Line ${i+1}: open=${openCount}, close=${closeCount}, depth=${depth} | ${lines[i].trim()}`);
  }
}
