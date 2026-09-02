const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(
  `status?: "PASSING" | "REPEATING" | "EXCLUDED" | "DROPOUT" | "ACTIVE";`,
  `status?: "PASSING" | "REPEATING" | "EXCLUDED" | "DROPOUT" | "ACTIVE";
  academicYear?: string;`
);

fs.writeFileSync('src/types/index.ts', code);
