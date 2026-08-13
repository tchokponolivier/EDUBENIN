const fs = require('fs');
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Ensure import NotificationMenu
if (!content.includes('NotificationMenu')) {
  content = content.replace(
    'import { UserSettingsModal } from "../UserSettingsModal";',
    `import { UserSettingsModal } from "../UserSettingsModal";\nimport { NotificationMenu } from "../NotificationMenu";`
  );
}

// Add the notification icon to the header
const target = `<div className="hidden md:block w-px h-6 bg-slate-200"></div>`;
const replacement = `<NotificationMenu />
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
console.log("Patched DashboardLayout");
