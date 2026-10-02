// @ts-nocheck
/// <reference types="vite/client" />
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

  select(cols = '*') { 
    if (!this.action || this.action === 'select') {
      this.action = 'select'; 
    }
    return this; 
  }
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
    await new Promise(r => setTimeout(r, 10)); // simulate network
    const storageKey = `mock_db_${this.table}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Ensure default test data always exists and is merged if missing
    if (this.table === 'schools') {
      const defaultSchool = { id: "11111111-1111-4111-8111-111111111111", name: "Lycée d'Excellence (Test)", locality: "Cotonou", contacts: "+229 00000000" };
      if (!data.some((s: any) => s.id === defaultSchool.id)) {
        data.unshift(defaultSchool);
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    } else if (this.table === 'profiles') {
      const defaultProfiles = [
        { id: "22222222-2222-4222-8222-222222222222", full_name: "Directeur Test", role: "SCHOOL_ADMIN", school_id: "11111111-1111-4111-8111-111111111111", email: "admin@school.com" },
        { id: "33333333-3333-4333-8333-333333333333", full_name: "Caissier Test", role: "CASHIER", school_id: "11111111-1111-4111-8111-111111111111", email: "caisse@school.com" },
        { id: "44444444-4444-4444-8444-444444444444", full_name: "Secrétaire Test", role: "SECRETARY", school_id: "11111111-1111-4111-8111-111111111111", email: "secretary@school.com" },
        { id: "55555555-5555-4555-8555-555555555555", full_name: "Parent Test", role: "PARENT", email: "parent@mail.com" },
        { id: "66666666-6666-4666-8666-666666666666", full_name: "Dir. Études Test", role: "DIRECTOR_OF_STUDIES", school_id: "11111111-1111-4111-8111-111111111111", email: "director@school.com" }
      ];
      // Filter out any previously auto-injected dummy teachers
      data = data.filter((p: any) => 
        !p.id?.startsWith("77777777-7777") && 
        p.email !== "prof@school.com" && 
        p.email !== "koffi.dossou@ecole.com" && 
        p.email !== "claire.ahouangbo@ecole.com" &&
        !p.email?.includes("prof.maths") &&
        !p.email?.includes("prof.francais") &&
        !p.email?.includes("prof.svt") &&
        !p.email?.endsWith("@ecole.com")
      );
      let updated = false;
      defaultProfiles.forEach(dp => {
        if (!data.some((p: any) => p.id === dp.id || (p.email && dp.email && p.email.toLowerCase() === dp.email.toLowerCase()))) {
          data.push(dp);
          updated = true;
        }
      });
      localStorage.setItem(storageKey, JSON.stringify(data));
    } else if (this.table === 'invitations') {
      // Filter out previously auto-injected dummy invitations
      data = data.filter((inv: any) => 
        inv.id !== "inv_1" && inv.id !== "inv_2" && inv.id !== "inv_3" &&
        !inv.email?.includes("prof.maths") && !inv.email?.includes("prof.francais") && !inv.email?.includes("prof.svt") &&
        !inv.email?.includes("prof@school.com") && !inv.email?.endsWith("@ecole.com")
      );
      localStorage.setItem(storageKey, JSON.stringify(data));
    } else if (this.table === 'students') {
      // Filter out dummy auto-injected students
      data = data.filter((s: any) => 
        s.id !== "s1" && s.id !== "s2" && s.id !== "s3" &&
        !(s.first_name === "Marc" && s.last_name === "Dubois") &&
        !(s.first_name === "Sophie" && s.last_name === "Dubois") &&
        !(s.first_name === "Junior" && s.last_name === "Kodjo")
      );
      localStorage.setItem(storageKey, JSON.stringify(data));
    } else if (this.table === 'courses') {
      const defaultCourses = [
        { id: "c1", school_id: "11111111-1111-4111-8111-111111111111", name: "Mathématiques", level: "6ème", teacher_id: null, coefficient: 3, created_at: new Date().toISOString() },
        { id: "c2", school_id: "11111111-1111-4111-8111-111111111111", name: "Français", level: "6ème", teacher_id: null, coefficient: 3, created_at: new Date().toISOString() },
        { id: "c3", school_id: "11111111-1111-4111-8111-111111111111", name: "SVT", level: "6ème", teacher_id: null, coefficient: 2, created_at: new Date().toISOString() },
        { id: "c4", school_id: "11111111-1111-4111-8111-111111111111", name: "Histoire-Géographie", level: "3ème", teacher_id: null, coefficient: 2, created_at: new Date().toISOString() },
        { id: "c5", school_id: "11111111-1111-4111-8111-111111111111", name: "Anglais", level: "6ème", teacher_id: null, coefficient: 2, created_at: new Date().toISOString() },
        { id: "c6", school_id: "11111111-1111-4111-8111-111111111111", name: "Mathématiques", level: "3ème", teacher_id: null, coefficient: 3, created_at: new Date().toISOString() },
        { id: "c7", school_id: "11111111-1111-4111-8111-111111111111", name: "Français", level: "3ème", teacher_id: null, coefficient: 3, created_at: new Date().toISOString() }
      ];
      let updated = false;
      defaultCourses.forEach(dc => {
        if (!data.some((c: any) => c.id === dc.id)) {
          data.push(dc);
          updated = true;
        }
      });
      if (updated || data.length === 0) {
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
    } else if (data.length === 0) {
      if (this.table === 'fee_config') {
        data.push(
          { id: "f1", school_id: "11111111-1111-4111-8111-111111111111", level: "ALL", fee_type: "INSCRIPTION", amount: 25000, created_at: new Date().toISOString() }
        );
      } else if (this.table === 'payments') {
        data.push(
          { id: "p1", school_id: "11111111-1111-4111-8111-111111111111", student_id: "s1", amount: 30000, status: "COMPLETED", payment_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(), created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(), items: [{ id: "tranche1", name: "Scolarité - Tranche 1", amount: 30000 }] }
        );
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
    }

    const checkMatches = (item) => {
      for (const f of this.filters) {
        const itemVal = item[f.col];
        if (f.type === 'eq' && itemVal !== f.val) return false;
        if (f.type === 'neq' && itemVal === f.val) return false;
        if (f.type === 'in' && !f.vals.includes(itemVal)) return false;
        if (f.type === 'ilike') {
          const target = String(f.val || '').replace(/%/g, '').toLowerCase();
          if (!String(itemVal || '').toLowerCase().includes(target)) return false;
        }
        if (f.type === 'like') {
          const target = String(f.val || '').replace(/%/g, '');
          if (!String(itemVal || '').includes(target)) return false;
        }
        if (f.type === 'is' && itemVal !== f.val) return false;
        if (f.type === 'gte' && Number(itemVal) < Number(f.val)) return false;
        if (f.type === 'lte' && Number(itemVal) > Number(f.val)) return false;
        if (f.type === 'gt' && Number(itemVal) <= Number(f.val)) return false;
        if (f.type === 'lt' && Number(itemVal) >= Number(f.val)) return false;
      }
      return true;
    };
    
    let result = null;
    if (this.action === 'select') {
      result = data.filter(checkMatches);
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
      const inserted = arr.map(item => ({ id: item.id || generateId(), created_at: new Date().toISOString(), ...item }));
      data.push(...inserted);
      localStorage.setItem(storageKey, JSON.stringify(data));
      result = (this.isSingle || this.isMaybeSingle) ? inserted[0] : inserted;
    } else if (this.action === 'update') {
      result = [];
      for (let i = 0; i < data.length; i++) {
        if (checkMatches(data[i])) {
          data[i] = { ...data[i], ...this.payload };
          result.push(data[i]);
        }
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
      result = (this.isSingle || this.isMaybeSingle) ? (result[0] || null) : result;
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
      data = data.filter(item => !checkMatches(item));
      localStorage.setItem(storageKey, JSON.stringify(data));
      result = [];
    }
    
    return { data: result, error: null };
  }
}

const mockAuth = {
  signInWithPassword: async () => ({ data: {}, error: null }),
  signUp: async () => ({ data: {}, error: null }),
  signInWithOAuth: async (_opts?: any) => ({ data: {}, error: null }),
  signOut: async () => ({ error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: (cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } })
};

const isPlaceholderConfig = !supabaseUrl || supabaseUrl.includes('placeholder-project') || supabaseUrl.includes('YOUR_SUPABASE_URL');

export const supabase = new Proxy(realSupabase, {
  get(target, prop) {
    const isTestAccount = isPlaceholderConfig || localStorage.getItem('is_test_account') === 'true';
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
