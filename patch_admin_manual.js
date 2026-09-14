const fs = require('fs');

let code = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf8');

const targetStr = `  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || totalAmount <= 0) return;
    if (hasPartialPayment && !nextPaymentDate) {
      alert("Veuillez indiquer la date du prochain règlement pour le reste à payer.");
      return;
    }
    
    const reference = 'PAY-' + Date.now();
    const items = currentPaymentItemsTemplate.map(i => ({ id: i.id, name: i.name, amount: i.amount }));
    const { data: inserted, error } = await supabase.from('payments').insert({
       school_id: selectedStudent.school_id,
       student_id: selectedStudent.id,
       parent_id: selectedStudent.parentId || null,
       amount: totalAmount,
       network: paymentMethod,
       status: 'COMPLETED',
       reference: reference,
       items: items, // Added items back
       next_payment_date: (hasPartialPayment && nextPaymentDate) ? nextPaymentDate : null
    }).select().single();

    if (error) {
       alert("Erreur lors de l'enregistrement: " + error.message);
       return;
    }
    alert("Paiement enregistré avec succès.");
    
    fetchData(); // Reload dashboard data
    setShowPayModal(false);
    setSelectedStudentId("");
    setSelectedFeeIds([]);
    setTrancheAmounts({});
    setCustomItems([{name: "", amount: ""}]);
    setPaymentMethod("ESPÈCES");
    
    if (isMomo) {
      if (window.confirm("Paiement enregistré pour vérification. Voulez-vous lancer le code USSD sur cet appareil pour valider la transaction via téléphone ?")) {
          const ussdCode = \`*880*41*681199*\${totalAmountWithFee}#\`;
          window.location.href = \`tel:\${ussdCode.replace('#', '%23')}\`;
      }
    }
  };`;

const replacementStr = `  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || totalAmount <= 0) return;
    if (hasPartialPayment && !nextPaymentDate) {
      alert("Veuillez indiquer la date du prochain règlement pour le reste à payer.");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedStudent || totalAmount <= 0) return;
    
    const reference = 'PAY-' + Date.now();
    const items = currentPaymentItemsTemplate.map(i => ({ id: i.id, name: i.name, amount: i.amount }));
    const { data: inserted, error } = await supabase.from('payments').insert({
       school_id: selectedStudent.school_id,
       student_id: selectedStudent.id,
       parent_id: selectedStudent.parentId || null,
       amount: totalAmount,
       network: paymentMethod,
       status: 'COMPLETED',
       reference: reference,
       items: items,
       next_payment_date: (hasPartialPayment && nextPaymentDate) ? nextPaymentDate : null
    }).select().single();

    if (error) {
       alert("Erreur lors de l'enregistrement: " + error.message);
       return;
    }
    alert("Paiement enregistré avec succès.");
    
    fetchData(); // Reload dashboard data
    setShowConfirmModal(false);
    setShowPayModal(false);
    setSelectedStudentId("");
    setSelectedFeeIds([]);
    setTrancheAmounts({});
    setCustomItems([{name: "", amount: ""}]);
    setPaymentMethod("ESPÈCES");
    
    if (isMomo) {
      if (window.confirm("Paiement enregistré pour vérification. Voulez-vous lancer le code USSD sur cet appareil pour valider la transaction via téléphone ?")) {
          const ussdCode = \`*880*41*681199*\${totalAmountWithFee}#\`;
          window.location.href = \`tel:\${ussdCode.replace('#', '%23')}\`;
      }
    }
  };`;

if (code.includes('const handleManualPayment = async (e: React.FormEvent) => {')) {
  // Use a targeted slice replace since there might be exact string discrepancies
  const startIndex = code.indexOf('const handleManualPayment = async (e: React.FormEvent) => {');
  const endIndex = code.indexOf('  const handleFeeToggle', startIndex);
  if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + replacementStr + "\n" + code.substring(endIndex);
    fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', code);
    console.log("Patched successfully");
  } else {
    console.log("Could not find boundaries");
  }
}
