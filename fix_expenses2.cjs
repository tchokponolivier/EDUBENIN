const fs = require('fs');
let content = fs.readFileSync('src/components/CashierExpenses.tsx', 'utf-8');

content = content.replace(`const [category: category === "AUTRE" ? customCategory : category, setCategory] = useState<Expense["category"]>("FOURNITURE");`, `const [category, setCategory] = useState<string>("MATERIEL_FOURNITURE");\n  const [customCategory, setCustomCategory] = useState("");`);

fs.writeFileSync('src/components/CashierExpenses.tsx', content);
