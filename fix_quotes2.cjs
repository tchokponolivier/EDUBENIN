const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('\\\\`')) {
    content = content.replace(/\\\\`/g, '`');
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
  } else if (content.includes('\\`')) {
    content = content.replace(/\\`/g, '`');
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
  }
}

fixFile('src/components/SupervisorTrips.tsx');
fixFile('src/components/SupervisorTeacherAbsences.tsx');
