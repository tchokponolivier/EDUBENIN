const fs = require('fs');

let content = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');

const replacement = `
  const confirmPayment = async () => {
    if (!user) return;

    // Build items payload (optional, if we want to store it in reference or items column - wait, payments schema doesn't have an items jsonb column, but maybe we can add one or ignore it for now. Let's just insert.)
    const child = children.find(c => c.id === selectedChildId);
    if (!child) return;
    
    let reference = 'PAY-' + Date.now();
    let ussdCode = "";
    if (network === "MTN Bénin") {
       ussdCode = \`*880*41*681199*\${totalAmountWithFee}#\`;
    } else if (network === "Moov Bénin") {
       ussdCode = \`*855*1*1*1*0195741278*0195741278*\${totalAmountWithFee}#\`;
    } else if (network === "Celtiis Bénin") {
       ussdCode = \`*889*4*1*0140688598*0140688598*\${totalAmountWithFee}#\`;
    }
    
    // Attempt insert into Supabase
    const { data: inserted, error } = await supabase.from('payments').insert({
       school_id: child.schoolId || user.schoolId || child.school_id, // ensure we have school_id
       student_id: selectedChildId,
       parent_id: user.id,
       amount: totalAmountWithFee,
       status: 'PENDING',
       network: network,
       reference: reference
    }).select().single();
    
    if (error) {
       console.error(error);
       alert("Erreur lors de l'enregistrement de la transaction.");
       return;
    }
    
    // We still update local state for immediate UI feedback
    const newPayment: any = { 
       id: inserted ? inserted.id : Date.now().toString(), 
       amount: totalAmountWithFee, 
       date: inserted ? new Date(inserted.created_at).getTime() : Date.now(), 
       reference: reference, 
       studentId: selectedChildId,
       status: 'PENDING',
       network: network
    };

    const updatedPays = [newPayment, ...allPayments];
    updatedPays.sort((a,b) => b.date - a.date);
    setAllPayments(updatedPays);
    
    setShowConfirmModal(false);
    setShowPayModal(false);
    
    // Alert the user that the status is pending verification
    alert("Votre paiement est passé en statut En Vérification. Vous allez être redirigé vers l'interface USSD pour finaliser le paiement.");
    
    // Launch USSD code
    if (ussdCode) {
       window.location.href = \`tel:\${ussdCode.replace('#', '%23')}\`;
    }
  };
`;

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('const confirmPayment = '));
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].trim() === '};') {
    // Check if the next line is handleWhatsAppReceipt
    if (lines[i+2] && lines[i+2].includes('const handleWhatsAppReceipt')) {
       endIdx = i;
       break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
   const before = lines.slice(0, startIdx).join('\n');
   const after = lines.slice(endIdx + 1).join('\n');
   fs.writeFileSync('src/pages/ParentPayments.tsx', before + '\n' + replacement.trim() + '\n' + after);
   console.log("Patched confirmPayment");
} else {
   console.log("Could not find bounds", startIdx, endIdx);
}
