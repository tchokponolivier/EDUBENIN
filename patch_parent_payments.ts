import fs from 'fs';
let content = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');

content = content.replace(
  `const confirmPayment = () => {\n    if (!user) return;\n    /* db.addPayment removed */\n    const updatedPays = [newPayment, ...allPayments];`,
  `const confirmPayment = () => {
    if (!user) return;
    const newPayment: any = { id: Date.now().toString(), amount: totalAmountWithFee, date: Date.now(), reference: 'PAY-' + Date.now() };
    const updatedPays = [newPayment, ...allPayments];`
);

fs.writeFileSync('src/pages/ParentPayments.tsx', content);
