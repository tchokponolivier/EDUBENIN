const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Let's copy MockQueryBuilder
class MockQueryBuilder {
  filters = [];
  isSingle = false;
  isMaybeSingle = false;
  orderRules = [];
  limitCount = null;
  action = 'select';
  payload = null;

  constructor(table) { this.table = table; }

  select(cols = '*') { return this; }
  insert(data) { this.action = 'insert'; this.payload = data; return this; }
  update(data) { this.action = 'update'; this.payload = data; return this; }
  upsert(data) { this.action = 'upsert'; this.payload = data; return this; }
  delete() { this.action = 'delete'; return this; }
  
  eq(col, val) { this.filters.push({ type: 'eq', col, val }); return this; }
  neq(col, val) { this.filters.push({ type: 'neq', col, val }); return this; }
  in(col, vals) { this.filters.push({ type: 'in', col, vals }); return this; }
  ilike(col, val) { this.filters.push({ type: 'ilike', col, val }); return this; }
  like(col, val) { this.filters.push({ type: 'like', col, val }); return this; }
  is(col, val) { this.filters.push({ type: 'is', col, val }); return this; }
  gte(col, val) { this.filters.push({ type: 'gte', col, val }); return this; }
  lte(col, val) { this.filters.push({ type: 'lte', col, val }); return this; }
  gt(col, val) { this.filters.push({ type: 'gt', col, val }); return this; }
  lt(col, val) { this.filters.push({ type: 'lt', col, val }); return this; }
  or(str) { return this; }
  
  order(col, opts) { this.orderRules.push({ col, ascending: opts?.ascending !== false }); return this; }
  limit(count) { this.limitCount = count; return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }
  
  async then(resolve, reject) {
    try { resolve(await this.execute()); } catch(e) { if(reject) reject(e); }
  }
  
  async execute() {
    const storageKey = `mock_db_${this.table}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
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
      } else if (this.table === 'invitations') {
        data.push(
          { id: "inv_1", email: "prof.maths@ecole.com", role: "TEACHER", school_id: "11111111-1111-4111-8111-111111111111", created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
          { id: "inv_2", email: "prof.francais@ecole.com", role: "TEACHER", school_id: "11111111-1111-4111-8111-111111111111", created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
          { id: "inv_3", email: "prof.svt@ecole.com", role: "TEACHER", school_id: "11111111-1111-4111-8111-111111111111", created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() }
        );
      } else if (this.table === 'students') {
        data.push(
          { id: "s1", parent_id: "55555555-5555-4555-8555-555555555555", school_id: "11111111-1111-4111-8111-111111111111", first_name: "Marc", last_name: "Dubois", level: "6ème", matricule: "2026-001", status: "ACTIVE", gender: "MALE", studentType: "OLD", parent_phone: "+229 97 12 34 56", contacts: "+229 97 12 34 56", created_at: new Date().toISOString() },
          { id: "s2", parent_id: "55555555-5555-4555-8555-555555555555", school_id: "11111111-1111-4111-8111-111111111111", first_name: "Sophie", last_name: "Dubois", level: "3ème", matricule: "2026-002", status: "ACTIVE", gender: "FEMALE", studentType: "OLD", parent_phone: "+229 95 44 22 11", contacts: "+229 95 44 22 11", created_at: new Date().toISOString() },
          { id: "s3", parent_id: "55555555-5555-4555-8555-555555555555", school_id: "11111111-1111-4111-8111-111111111111", first_name: "Junior", last_name: "Kodjo", level: "Terminale D", matricule: "2026-003", status: "ACTIVE", gender: "MALE", studentType: "NEW", parent_phone: "+229 96 82 79 23", contacts: "+229 96 82 79 23", created_at: new Date().toISOString() }
        );
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
    }

    const checkMatches = (item) => {
      for (const f of this.filters) {
        const itemVal = item[f.col];
        if (f.type === 'eq' && itemVal !== f.val) return false;
      }
      return true;
    };
    
    let result = data.filter(checkMatches);
    if (this.isSingle) result = result[0] || null;
    return { data: result, error: null };
  }
}

const mockDb = {
  from: (t) => new MockQueryBuilder(t)
};

async function test() {
  const p = await mockDb.from('profiles').select('*');
  console.log('Profiles in mock:', p.data.map(x => ({ name: x.full_name, role: x.role })));
  const inv = await mockDb.from('invitations').select('*');
  console.log('Invitations in mock:', inv.data.map(x => ({ email: x.email, role: x.role })));
  const st = await mockDb.from('students').select('*');
  console.log('Students in mock:', st.data.map(x => ({ name: x.first_name, level: x.level })));
}
test();
