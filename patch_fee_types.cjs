const fs = require('fs');
let content = fs.readFileSync('src/types/index.ts', 'utf-8');
content = content.replace(
   'feeType: "INSCRIPTION" | "MONTHLY" | "TRANSPORT" | "CANTEEN" | "OTHER";',
   'feeType: "INSCRIPTION" | "MONTHLY" | "TRANSPORT" | "CANTEEN" | "OTHER" | "BOOKS" | "ID_CARD" | "UNIFORMS" | "EVALUATION" | "BOOK_KITS";'
);
fs.writeFileSync('src/types/index.ts', content);
console.log("Patched types");
