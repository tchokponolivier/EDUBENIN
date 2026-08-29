const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetRouter = `case 'TEACHER': return <Navigate to="/teacher" replace />;\n    default: return <Navigate to="/" replace />;`;
const insertRouter = `case 'TEACHER': return <Navigate to="/teacher" replace />;\n    case 'SUPERVISOR': return <Navigate to="/supervisor" replace />;\n    case 'DIRECTOR_OF_STUDIES': return <Navigate to="/director" replace />;\n    default: return <Navigate to="/" replace />;`;
content = content.replace(targetRouter, insertRouter);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched supervisor in App.tsx");
