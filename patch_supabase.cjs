const fs = require('fs');
let content = `/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

const generateId = () => {
  try { return crypto.randomUUID(); } 
  catch(e) { return Math.random().toString(36).substring(2, 15); }
};

class MockQueryBuilder {
  filters = [];
  isSingle = false;
  isMaybeSingle = false;
  orderRules = [];
  limitCount = null;
  action = 'select';
  payload = null;

  constructor(public table) {}

  select(cols = '*') { this.action = 'select'; return this; }
  insert(data) { this.action = 'insert'; this.payload = data; return this; }
  update(data) { this.action = 'update'; this.payload = data; return this; }
  upsert(data) { this.action = 'upsert'; this.payload = data; return this; }
  delete() { this.action = 'delete'; return this; }
  
  eq(col, val) { this.filters.push({ type: 'eq', col, val }); return this; }
  neq(col, val) { this.filters.push({ type: 'neq', col, val }); return this; }
  in(col, vals) { this.filters.push({ type: 'in', col, vals }); return this; }
  or(str) { return this; }
  
  order(col, opts) { this.orderRules.push({ col, ascending: opts?.ascending !== false }); return this; }
  limit(count) { this.limitCount = count; return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }
  
  async then(resolve, reject) {
    try { resolve(await this.execute()); } catch(e) { if(reject) reject(e); }
  }
  
  async execute() {
    await new Promise(r => setTimeout(r, 10)); // simulate network
    const storageKey = \`mock_db_\${this.table}\`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Auto-seed some data so UI isn't completely empty for tests
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
    }
    
    let result = null;
    if (this.action === 'select') {
      result = [...data];
      for (const f of this.filters) {
        if (f.type === 'eq') result = result.filter(d => d[f.col] === f.val);
        else if (f.type === 'neq') result = result.filter(d => d[f.col] !== f.val);
        else if (f.type === 'in') result = result.filter(d => f.vals.includes(d[f.col]));
      }
      for (const rule of this.orderRules) {
        result.sort((a, b) => {
          if (a[rule.col] < b[rule.col]) return rule.ascending ? -1 : 1;
          if (a[rule.col] > b[rule.col]) return rule.ascending ? 1 : -1;
          return 0;
        });
      }
      if (this.limitCount) result = result.slice(0, this.limitCount);
      if (this.isSingle) {
        if (result.length === 0) return { data: null, error: { message: "Row not found" } };
        result = result[0];
      } else if (this.isMaybeSingle) {
        result = result.length > 0 ? result[0] : null;
      }
    } else if (this.action === 'insert') {
      const arr = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = arr.map(item => ({ id: generateId(), created_at: new Date().toISOString(), ...item }));
      data.push(...inserted);
      localStorage.setItem(storageKey, JSON.stringify(data));
      result = this.isSingle ? inserted[0] : inserted;
    } else if (this.action === 'update') {
      result = [];
      for (let i = 0; i < data.length; i++) {
        let match = true;
        for (const f of this.filters) {
          if (f.type === 'eq' && data[i][f.col] !== f.val) match = false;
        }
        if (match) {
          data[i] = { ...data[i], ...this.payload };
          result.push(data[i]);
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
      result = this.isSingle ? result[0] || null : result;
    } else if (this.action === 'upsert') {
       const toUpsert = Array.isArray(this.payload) ? this.payload : [this.payload];
       for (const item of toUpsert) {
         const idx = data.findIndex(d => d.id === item.id);
         if (idx >= 0) data[idx] = { ...data[idx], ...item };
         else data.push({ id: item.id || generateId(), created_at: new Date().toISOString(), ...item });
       }
       localStorage.setItem(storageKey, JSON.stringify(data));
       result = toUpsert;
    } else if (this.action === 'delete') {
      data = data.filter(item => {
        let match = true;
        for (const f of this.filters) {
          if (f.type === 'eq' && item[f.col] !== f.val) match = false;
        }
        return !match;
      });
      localStorage.setItem(storageKey, JSON.stringify(data));
      result = [];
    }
    
    return { data: result, error: null };
  }
}

const mockAuth = {
  signInWithPassword: async () => ({ data: {}, error: null }),
  signUp: async () => ({ data: {}, error: null }),
  signOut: async () => ({ error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: (cb) => ({ data: { subscription: { unsubscribe: () => {} } } })
};

export const supabase = new Proxy(realSupabase, {
  get(target, prop) {
    const isTestAccount = localStorage.getItem('is_test_account') === 'true';
    if (!isTestAccount) {
      return target[prop];
    }
    
    if (prop === 'from') {
      return (table) => new MockQueryBuilder(table);
    }
    if (prop === 'auth') {
      return mockAuth;
    }
    
    return target[prop];
  }
});
`;

fs.writeFileSync('src/lib/supabase.ts', content);
console.log("Patched supabase.ts");
