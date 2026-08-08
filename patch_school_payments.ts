import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

content = content.replace(
  `  const handleManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || totalAmount <= 0) return;

    /* db.addPayment removed */

    setPayments(prev => [newPayment, ...prev]);`,
  `  const handleManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || totalAmount <= 0) return;
    const newPayment: any = { id: Date.now().toString(), amount: totalAmount, date: Date.now(), reference: 'PAY-' + Date.now() };
    setPayments(prev => [newPayment, ...prev]);`
);

content = content.replace(
  `const executeWhatsAppReceipt = (phone: string, payment: Payment, student: Student) => {
    const formattedPhone = phone.replace(/\\D/g, '');
    const settings = schoolSettings;`,
  `const executeWhatsAppReceipt = (phone: string, payment: Payment, student: Student) => {
    const formattedPhone = phone.replace(/\\D/g, '');
    const settings: any = { name: "École" };`
);

content = content.replace(
  `    const settings = schoolSettings;
    
    // Receipt HTML`,
  `    const settings: any = { name: "École" };
    
    // Receipt HTML`
);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
