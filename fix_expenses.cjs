const fs = require('fs');
let code = fs.readFileSync('src/components/CashierExpenses.tsx', 'utf8');

code = code.replace(
  `const [showForm, setShowForm] = useState(false);`,
  `const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);`
);

code = code.replace(
  `const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('expenses').insert({
       school_id: user.schoolId,
       description,
       amount: Number(amount),
       expense_date: expenseDate,
       category: category === "AUTRE" ? customCategory : category,
       proof_url: proofBase64 || null
    });`,
  `const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const finalCategory = category === "AUTRE" ? customCategory : category;
    
    let error;
    if (editingId) {
       const res = await supabase.from('expenses').update({
           description,
           amount: Number(amount),
           expense_date: expenseDate,
           category: finalCategory,
           proof_url: proofBase64 || null
       }).eq('id', editingId);
       error = res.error;
    } else {
       const res = await supabase.from('expenses').insert({
           school_id: user.schoolId,
           description,
           amount: Number(amount),
           expense_date: expenseDate,
           category: finalCategory,
           proof_url: proofBase64 || null
       });
       error = res.error;
    }`
);

code = code.replace(
  `setCustomCategory("");
       setProofBase64("");`,
  `setCustomCategory("");
       setProofBase64("");
       setEditingId(null);`
);

// Add edit function
code = code.replace(
  `return (
    <div className="space-y-6">`,
  `const handleEdit = (expense: Expense) => {
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setExpenseDate(expense.expenseDate || "");
    const presetCategories = ["MATERIEL_FOURNITURE", "ENTRETIEN", "SERVICES_EXTERIEURS", "ACHAT_STOCKS"];
    if (presetCategories.includes(expense.category)) {
       setCategory(expense.category);
       setCustomCategory("");
    } else {
       setCategory("AUTRE");
       setCustomCategory(expense.category);
    }
    setProofBase64(expense.proofUrl || "");
    setEditingId(expense.id);
    setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  return (
    <div className="space-y-6">`
);

// Modify buttons in table
code = code.replace(
  `<td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{expense.amount.toLocaleString()} FCFA</td>
              </tr>`,
  `<td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{expense.amount.toLocaleString()} FCFA</td>
                <td className="px-6 py-4 text-sm text-right">
                   <button onClick={() => handleEdit(expense)} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase tracking-wider mr-3">Éditer</button>
                   <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">Supprimer</button>
                </td>
              </tr>`
);

code = code.replace(
  `<th className="px-6 py-4 text-right">Montant</th>
            </tr>`,
  `<th className="px-6 py-4 text-right">Montant</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>`
);

fs.writeFileSync('src/components/CashierExpenses.tsx', code);
