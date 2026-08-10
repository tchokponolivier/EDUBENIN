const fs = require('fs');
let content = fs.readFileSync('src/pages/ParentSupport.tsx', 'utf-8');

content = content.replace('+229 01 66 82 79 24', '+229 01 40 68 85 98');

const submitFunc = `
  const { user } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setSubmitted(true); // Treat as loading state initially
    try {
      const payload = {
        name: user?.name || "Parent",
        email: user?.email || "parent@example.com",
        subject: topic,
        message: message,
        timestamp: new Date().toISOString(),
        page: window.location.href
      };
      
      await fetch("https://counter-words.kochidigital229.workers.dev/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setTimeout(() => {
        setSubmitted(false);
        setMessage("");
        setPhoto("");
        alert("Votre message a été envoyé avec succès !");
      }, 1000);
    } catch (err) {
      alert("Erreur lors de l'envoi du message.");
      setSubmitted(false);
    }
  };
`;

content = content.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?\}, 4000\);\n  \};/,
  submitFunc
);

if (!content.includes('useAuth')) {
  content = content.replace(
    'import { HelpCircle, CheckCircle2, MessageSquare, AlertTriangle, Send, Camera, X } from "lucide-react";',
    'import { HelpCircle, CheckCircle2, MessageSquare, AlertTriangle, Send, Camera, X } from "lucide-react";\nimport { useAuth } from "../lib/auth";'
  );
}

fs.writeFileSync('src/pages/ParentSupport.tsx', content);
