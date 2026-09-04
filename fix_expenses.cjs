const fs = require('fs');
let code = fs.readFileSync('src/components/CashierExpenses.tsx', 'utf8');

// Style the file input
code = code.replace(
  `<input type="file" accept="image/*" onChange={handleUpload} className="w-full text-xs" />`,
  `<input type="file" accept="image/*" onChange={handleUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 bg-emerald-50/20 rounded border border-emerald-200 outline-none" />`
);

// Add Action Column Header
code = code.replace(
  `<th className="px-6 py-3 font-semibold">Justificatif</th>
                <th className="px-6 py-3 font-semibold text-right">Montant (FCFA)</th>`,
  `<th className="px-6 py-3 font-semibold">Justificatif</th>
                <th className="px-6 py-3 font-semibold text-right">Montant (FCFA)</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>`
);

// Add Action Column Body
code = code.replace(
  `<td className="px-6 py-4 text-sm font-bold text-red-600 text-right">- {exp.amount.toLocaleString()}</td>
              </tr>`,
  `<td className="px-6 py-4 text-sm font-bold text-red-600 text-right">- {exp.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button onClick={() => handleEdit(exp)} className="text-emerald-600 font-bold hover:underline">Éditer</button>
                    <button onClick={() => handleDelete(exp.id)} className="text-red-600 font-bold hover:underline">Supprimer</button>
                </td>
              </tr>`
);

code = code.replace(
  `<td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">`,
  `<td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">`
);

fs.writeFileSync('src/components/CashierExpenses.tsx', code);
