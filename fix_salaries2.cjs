const fs = require('fs');
let content = fs.readFileSync('src/components/CashierSalaries.tsx', 'utf-8');

content = content.replace(`month: month,`, `period_start: periodStart, period_end: periodEnd, deductions: deductions,`);

fs.writeFileSync('src/components/CashierSalaries.tsx', content);
