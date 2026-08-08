import fs from 'fs';
let content = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');

content = content.replace(
  "/* db.addPayment removed */",
  "/* db.addPayment removed */\n    const newPayment: any = { id: Date.now().toString(), amount: totalAmountWithFee, date: Date.now(), reference: 'PAY-' + Date.now(), studentId: selectedStudentId };"
);

fs.writeFileSync('src/pages/ParentPayments.tsx', content);
