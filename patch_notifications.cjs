const fs = require('fs');
let content = fs.readFileSync('src/lib/useNotifications.ts', 'utf-8');

const target = `export interface AppNotification {
  id: string;
  type: 'PAYMENT' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  date: number;
  read: boolean;
  link: string;
}`;

const insert = `export interface AppNotification {
  id: string;
  type: 'PAYMENT' | 'ANNOUNCEMENT' | 'SUPPORT';
  title: string;
  message: string;
  date: number;
  read: boolean;
  link: string;
}`;

content = content.replace(target, insert);

const fetchTarget = `      if (user.role === 'PARENT') {`;
const fetchInsert = `      // 3. Fetch Support Notifications for Admin, Cashier, Secretary
      if (['SCHOOL_ADMIN', 'CASHIER', 'SECRETARY', 'SUPERVISOR'].includes(user.role)) {
        const { data: dbNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('school_id', user.schoolId)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (dbNotifs) {
          dbNotifs.forEach((n: any) => {
            notifs.push({
              id: \`dbnotif-\${n.id}\`,
              type: n.type as any,
              title: n.title,
              message: n.message,
              date: new Date(n.created_at).getTime(),
              read: readIds.includes(\`dbnotif-\${n.id}\`),
              link: user.role === 'SECRETARY' ? '/school-admin/students' : '/school-admin'
            });
          });
        }
      }

      if (user.role === 'PARENT') {`;

content = content.replace(fetchTarget, fetchInsert);

fs.writeFileSync('src/lib/useNotifications.ts', content);
console.log("Patched useNotifications");
