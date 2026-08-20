const fs = require('fs');
let content = fs.readFileSync('src/lib/supabase.ts', 'utf-8');

const targetSeed = `    // Auto-seed some data so UI isn't completely empty for tests
    if (data.length === 0) {
      if (this.table === 'schools') {
        data.push({ id: "11111111-1111-4111-8111-111111111111", name: "Ecole Primaire Test", locality: "Cotonou", contacts: "0000" });
      } else if (this.table === 'profiles') {
        data.push(
          { id: "22222222-2222-4222-8222-222222222222", full_name: "Directeur Ecole A", role: "SCHOOL_ADMIN", school_id: "11111111-1111-4111-8111-111111111111" },
          { id: "55555555-5555-4555-8555-555555555555", full_name: "Parent E.", role: "PARENT" }
        );
      } else if (this.table === 'students') {
        data.push(
          { id: "s1", parent_id: "55555555-5555-4555-8555-555555555555", school_id: "11111111-1111-4111-8111-111111111111", first_name: "Enfant", last_name: "Test", level: "CM1", matricule: "M001", status: "ACTIVE", created_at: new Date().toISOString() }
        );
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
    }`;

const newSeed = `    // Auto-seed some data so UI isn't completely empty for tests
    if (data.length === 0) {
      if (this.table === 'schools') {
        data.push({ id: "11111111-1111-4111-8111-111111111111", name: "Lycée d'Excellence (Test)", locality: "Cotonou", contacts: "+229 00000000" });
      } else if (this.table === 'profiles') {
        data.push(
          { id: "22222222-2222-4222-8222-222222222222", full_name: "Directeur Test", role: "SCHOOL_ADMIN", school_id: "11111111-1111-4111-8111-111111111111", email: "admin@school.com" },
          { id: "33333333-3333-4333-8333-333333333333", full_name: "Caissier Test", role: "CASHIER", school_id: "11111111-1111-4111-8111-111111111111", email: "caisse@school.com" },
          { id: "44444444-4444-4444-8444-444444444444", full_name: "Secrétaire Test", role: "SECRETARY", school_id: "11111111-1111-4111-8111-111111111111", email: "secretary@school.com" },
          { id: "55555555-5555-4555-8555-555555555555", full_name: "Parent Test", role: "PARENT", email: "parent@mail.com" },
          { id: "66666666-6666-4666-8666-666666666666", full_name: "Dir. Études Test", role: "DIRECTOR_OF_STUDIES", school_id: "11111111-1111-4111-8111-111111111111", email: "director@school.com" },
          { id: "77777777-7777-4777-8777-777777777777", full_name: "Professeur Test", role: "TEACHER", school_id: "11111111-1111-4111-8111-111111111111", email: "prof@school.com" }
        );
      } else if (this.table === 'students') {
        data.push(
          { id: "s1", parent_id: "55555555-5555-4555-8555-555555555555", school_id: "11111111-1111-4111-8111-111111111111", first_name: "Marc", last_name: "Dubois", level: "CM1", matricule: "2024-001", status: "ACTIVE", created_at: new Date().toISOString() },
          { id: "s2", parent_id: "55555555-5555-4555-8555-555555555555", school_id: "11111111-1111-4111-8111-111111111111", first_name: "Sophie", last_name: "Dubois", level: "6ème", matricule: "2024-002", status: "ACTIVE", created_at: new Date().toISOString() }
        );
      } else if (this.table === 'fee_config') {
        data.push(
          { id: "f1", school_id: "11111111-1111-4111-8111-111111111111", level: "ALL", fee_type: "INSCRIPTION", amount: 25000, created_at: new Date().toISOString() }
        );
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
    }`;

content = content.replace(targetSeed, newSeed);
fs.writeFileSync('src/lib/supabase.ts', content);
console.log("Patched supabase.ts seeds");
