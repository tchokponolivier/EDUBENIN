const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');

// Change activeTab to use useSearchParams
if (!content.includes('useSearchParams')) {
  content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect } from "react";\nimport { useSearchParams } from "react-router-dom";'
  );
  content = content.replace(
    'const [activeTab, setActiveTab] = useState<"DASHBOARD" | "SETTINGS">("DASHBOARD");',
    `const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'SETTINGS' ? 'SETTINGS' : 'DASHBOARD';
  const setActiveTab = (tab: string) => setSearchParams({ tab });`
  );
  fs.writeFileSync('src/pages/SchoolAdmin.tsx', content);
}

let navContent = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');
if (!navContent.includes('Paramètres Établissement')) {
  navContent = navContent.replace(
    '{ name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },',
    '{ name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },\n          { name: "Paramètres Établissement", href: "/school-admin?tab=SETTINGS", icon: Settings },'
  );
  fs.writeFileSync('src/components/layout/DashboardLayout.tsx', navContent);
}

