const fs = require('fs');
let content = fs.readFileSync('src/pages/ParentSupport.tsx', 'utf-8');

const target = `      await fetch("https://counter-words.kochidigital229.workers.dev/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setTopic("");
      setMessage("");
      setFile(null);
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);`;

const insert = `      const { supabase } = await import('../lib/supabase');
      if (user?.schoolId) {
        await supabase.from('notifications').insert({
          school_id: user.schoolId,
          title: 'Demande Assistance: ' + topic,
          message: 'De ' + (user?.name || 'Parent') + ' : ' + message,
          type: 'SUPPORT'
        });
      }
      
      const text = encodeURIComponent(\`*Demande d'assistance EduBénin*\\n*Sujet:* \${topic}\\n*Message:* \${message}\\n*Parent:* \${user?.name}\`);
      window.open(\`https://wa.me/2290140688598?text=\${text}\`, '_blank');
      
      setTopic("");
      setMessage("");
      setFile(null);
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);`;

content = content.replace(target, insert);

// Fix "SIGNALER / DEMANDE SPECIALE est trop colé sur la card de Historique détaillé espace un peu" in Absences & retards.
// Wait, that's in Parent.tsx (Absences tab) maybe? Let's check where the "SIGNALER / DEMANDE SPECIALE" is.

fs.writeFileSync('src/pages/ParentSupport.tsx', content);
console.log("Patched ParentSupport");
