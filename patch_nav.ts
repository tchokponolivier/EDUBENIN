import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Update getNavigation
content = content.replace(
  `const getNavigation = () => {`,
  `const getNavigation = () => {
    const commonSettings = { name: "Paramètres", href: "#settings", icon: Settings, action: () => setIsSettingsOpen(true) };`
);

content = content.replace(
  `return [{ name: "Établissements", href: "/super-admin", icon: Building }];`,
  `return [
          { name: "Établissements", href: "/super-admin", icon: Building },
          commonSettings
        ];`
);

content = content.replace(
  `{ name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },`,
  `{ name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          commonSettings`
);

content = content.replace(
  `{ name: "Élèves (Saisie)", href: "/school-admin/students", icon: Users },`,
  `{ name: "Élèves (Saisie)", href: "/school-admin/students", icon: Users },
          commonSettings`
);

content = content.replace(
  `{ name: "Paiements (Caisse)", href: "/school-admin/payments", icon: CreditCard },`,
  `{ name: "Paiements (Caisse)", href: "/school-admin/payments", icon: CreditCard },
          commonSettings`
);

content = content.replace(
  `{ name: "Assistance", href: "/parent/support", icon: HelpCircle },`,
  `{ name: "Assistance", href: "/parent/support", icon: HelpCircle },
          commonSettings`
);

content = content.replace(
  `{ name: "Mon Profil", href: "/teacher/profile", icon: User },`,
  `{ name: "Mon Profil", href: "/teacher/profile", icon: User },
          commonSettings`
);

// Update nav items rendering
content = content.replace(
  `return (
              <Link
                key={item.name}
                to={item.href}`,
  `if ((item as any).action) {
              return (
                <button
                  key={item.name}
                  onClick={() => { (item as any).action(); setIsMobileMenuOpen(false); }}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded transition-colors font-medium w-full text-left",
                    "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <ItemIcon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.href}`
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
