const fs = require('fs');
let content = fs.readFileSync('src/components/CashierEnrollment.tsx', 'utf-8');
content = content.replace('import { isPrimarySchool } from "../lib/utils";', '');
content = content.replace('const resetForm = () => {', 'const isPrimarySchool = (lv: string) => {\n    return lv.startsWith("Maternelle") || lv.startsWith("CI") || lv.startsWith("CP") || lv.startsWith("CE") || lv.startsWith("CM");\n  };\n\n  const resetForm = () => {');
fs.writeFileSync('src/components/CashierEnrollment.tsx', content);
