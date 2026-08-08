import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

// Add useLocation
if (!content.includes('useLocation')) {
  content = content.replace(
    `import { Search, CreditCard, Clock, CheckCircle, FileText, Download, TrendingUp, TrendingDown, DollarSign, Plus, X, Trash2, Calendar, MessageCircle } from "lucide-react";`,
    `import { Search, CreditCard, Clock, CheckCircle, FileText, Download, TrendingUp, TrendingDown, DollarSign, Plus, X, Trash2, Calendar, MessageCircle } from "lucide-react";\nimport { useLocation } from "react-router-dom";`
  );
}

// Update useState for activeTab
content = content.replace(
  `const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD">("PAYMENTS");`,
  `const location = useLocation();\n  const [activeTab, setActiveTab] = useState<"PAYMENTS" | "EXPENSES" | "SALARIES" | "DASHBOARD">(() => {\n    const params = new URLSearchParams(location.search);\n    const tab = params.get('tab');\n    if (tab === "PAYMENTS" || tab === "EXPENSES" || tab === "SALARIES" || tab === "DASHBOARD") return tab;\n    return "PAYMENTS";\n  });\n\n  // Sync state if URL changes\n  React.useEffect(() => {\n    const params = new URLSearchParams(location.search);\n    const tab = params.get('tab');\n    if (tab === "PAYMENTS" || tab === "EXPENSES" || tab === "SALARIES" || tab === "DASHBOARD") setActiveTab(tab);\n  }, [location.search]);`
);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
