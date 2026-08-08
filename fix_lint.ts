import fs from 'fs';
let content = fs.readFileSync('src/pages/TeacherDashboard.tsx', 'utf-8');

content = content.replace(
  "comment.trim() === ''",
  "String(comment).trim() === ''"
);

content = content.replace(
  "scoreStr.trim() !== ''",
  "String(scoreStr).trim() !== ''"
);

fs.writeFileSync('src/pages/TeacherDashboard.tsx', content);
