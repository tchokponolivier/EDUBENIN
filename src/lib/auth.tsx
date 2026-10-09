import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, fullName?: string, password?: string, role?: string) => Promise<void>;
  loginWithGoogle: (preferredRole?: string, preferredEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSchool: (schoolId: string, schoolName?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock Users for testing
const MOCK_USERS: Record<string, User> = {
  "admin@school.com": {
    id: "22222222-2222-4222-8222-222222222222",
    email: "admin@school.com",
    name: "Directeur Ecole A",
    role: "SCHOOL_ADMIN",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "caisse@school.com": {
    id: "33333333-3333-4333-8333-333333333333",
    email: "caisse@school.com",
    name: "Caisse Ecole",
    role: "CASHIER",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "secretary@school.com": {
    id: "44444444-4444-4444-8444-444444444444",
    email: "secretary@school.com",
    name: "Secrétaire Ecole",
    role: "SECRETARY",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "surveillant@school.com": {
    id: "88888888-8888-4888-8888-888888888888",
    email: "surveillant@school.com",
    name: "Surveillant Test",
    role: "SUPERVISOR",
    schoolId: "11111111-1111-4111-8111-111111111111",
  },
  "parent@mail.com": {
    id: "55555555-5555-4555-8555-555555555555",
    email: "parent@mail.com",
    name: "Parent E.",
    role: "PARENT",
  },
  "director@school.com": {
    id: "66666666-6666-4666-8666-666666666666",
    email: "director@school.com",
    name: "Directeur des Études",
    role: "DIRECTOR_OF_STUDIES",
    schoolId: "11111111-1111-4111-8111-111111111111",
  }
};

export interface InvitationMatch {
  schoolId: string;
  role: string;
  email: string;
  invitedByName?: string;
  invitedByRole?: string;
  schoolName?: string;
}

const isPlaceholderSupabase = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder-project') || import.meta.env.VITE_SUPABASE_URL.includes('YOUR_SUPABASE_URL');

export function validateStoredUser(rawJson: string | null): User | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.id || !parsed.email || typeof parsed.email !== 'string') return null;
    
    const validRoles = [
      'SUPER_ADMIN', 
      'SCHOOL_ADMIN', 
      'DIRECTOR_OF_STUDIES', 
      'TEACHER', 
      'SECRETARY', 
      'CASHIER', 
      'SUPERVISOR', 
      'PARENT'
    ];
    if (!validRoles.includes(parsed.role)) return null;

    // Security check: in production (when real Supabase is configured),
    // local storage mock accounts cannot grant administrative rights without authenticated session
    if (!isPlaceholderSupabase) {
      if (parsed.role === 'SUPER_ADMIN' || parsed.role === 'SCHOOL_ADMIN' || parsed.role === 'DIRECTOR_OF_STUDIES') {
        return null;
      }
    }

    return {
      id: String(parsed.id),
      email: String(parsed.email).trim().toLowerCase(),
      name: String(parsed.name || parsed.email.split('@')[0]),
      role: parsed.role,
      schoolId: parsed.schoolId ? String(parsed.schoolId) : undefined,
      schoolName: parsed.schoolName ? String(parsed.schoolName) : undefined,
      phone: parsed.phone ? String(parsed.phone) : undefined,
      avatar: parsed.avatar ? String(parsed.avatar) : undefined
    };
  } catch (e) {
    return null;
  }
}

export async function resolveSchoolName(schoolId?: string | null): Promise<string | undefined> {
  if (!schoolId) return undefined;
  try {
    const { data: s } = await supabase.from('schools').select('name').eq('id', schoolId).maybeSingle();
    if (s?.name) {
      localStorage.setItem('edubenin_active_school_name', s.name);
      return s.name;
    }
  } catch(e) {}
  return localStorage.getItem('edubenin_active_school_name') || undefined;
}

export async function findInvitationForEmail(email: string): Promise<InvitationMatch | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  // 1. Check Supabase invitations table
  try {
    const { data: inv } = await supabase
      .from('invitations')
      .select('*')
      .ilike('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (inv && (inv.school_id || inv.schoolId)) {
      const sId = inv.school_id || inv.schoolId;
      const sName = inv.school_name || inv.schoolName || await resolveSchoolName(sId);
      return {
        schoolId: sId,
        role: inv.role || 'TEACHER',
        email: cleanEmail,
        invitedByName: inv.invited_by_name || inv.invitedByName,
        invitedByRole: inv.invited_by_role || inv.invitedByRole,
        schoolName: sName
      };
    }
  } catch (e) {
    console.warn("Could not query invitations table:", e);
  }

  // 2. Check mock_db_invitations in localStorage
  try {
    const localInvs = JSON.parse(localStorage.getItem('mock_db_invitations') || '[]');
    const found = localInvs.find((i: any) => i.email && i.email.trim().toLowerCase() === cleanEmail);
    if (found && (found.school_id || found.schoolId)) {
      const sId = found.school_id || found.schoolId;
      const sName = found.school_name || found.schoolName || await resolveSchoolName(sId);
      return {
        schoolId: sId,
        role: found.role || 'TEACHER',
        email: cleanEmail,
        invitedByName: found.invited_by_name || found.invitedByName,
        invitedByRole: found.invited_by_role || found.invitedByRole,
        schoolName: sName
      };
    }
  } catch (e) {}

  // 3. Check school_invitations_meta_* across localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('school_invitations_meta_')) {
        const schoolId = key.replace('school_invitations_meta_', '');
        const meta = JSON.parse(localStorage.getItem(key) || '{}');
        const match = meta[cleanEmail] || Object.entries(meta).find(([k]) => k.trim().toLowerCase() === cleanEmail)?.[1];
        if (match) {
          const sName = (match as any).school_name || await resolveSchoolName(schoolId);
          return {
            schoolId,
            role: (match as any).role || 'TEACHER',
            email: cleanEmail,
            invitedByName: (match as any).invited_by_name,
            invitedByRole: (match as any).invited_by_role,
            schoolName: sName
          };
        }
      }
    }
  } catch (e) {}

  // 4. Check school_custom_teachers_* across localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('school_custom_teachers_')) {
        const schoolId = key.replace('school_custom_teachers_', '');
        const teachers = JSON.parse(localStorage.getItem(key) || '[]');
        const found = teachers.find((t: any) => t.email && t.email.trim().toLowerCase() === cleanEmail);
        if (found) {
          const sId = found.school_id || schoolId;
          const sName = found.school_name || await resolveSchoolName(sId);
          return {
            schoolId: sId,
            role: 'TEACHER',
            email: cleanEmail,
            invitedByName: found.invited_by_name,
            invitedByRole: found.invited_by_role,
            schoolName: sName
          };
        }
      }
    }
  } catch (e) {}

  // 5. Check secretary_staff_meta_* across localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secretary_staff_meta_')) {
        const schoolId = key.replace('secretary_staff_meta_', '');
        const meta = JSON.parse(localStorage.getItem(key) || '{}');
        const match = meta[cleanEmail] || Object.entries(meta).find(([k]) => k.trim().toLowerCase() === cleanEmail)?.[1];
        if (match) {
          const sName = (match as any).school_name || await resolveSchoolName(schoolId);
          return {
            schoolId,
            role: (match as any).role || 'TEACHER',
            email: cleanEmail,
            invitedByName: (match as any).name || (match as any).full_name,
            invitedByRole: 'DIRECTOR_OF_STUDIES',
            schoolName: sName
          };
        }
      }
    }
  } catch (e) {}

  // 6. Check profiles table and mock_db_profiles
  try {
    const { data: p } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .ilike('email', cleanEmail)
      .maybeSingle();
    if (p && p.school_id) {
      const sName = await resolveSchoolName(p.school_id);
      return {
        schoolId: p.school_id,
        role: p.role,
        email: cleanEmail,
        schoolName: sName
      };
    }
  } catch (e) {}

  try {
    const mockProfiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
    const p = mockProfiles.find((x: any) => x.email && x.email.trim().toLowerCase() === cleanEmail);
    if (p && p.school_id) {
      const sName = p.school_name || await resolveSchoolName(p.school_id);
      return {
        schoolId: p.school_id,
        role: p.role,
        email: cleanEmail,
        schoolName: sName
      };
    }
  } catch (e) {}

  return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realSchoolId, setRealSchoolId] = useState<string | null>(null);
  const [realProfileId, setRealProfileId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('schools').select('id').order('created_at', { ascending: false }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setRealSchoolId(data[0].id);
        if (!localStorage.getItem('edubenin_active_school_id')) {
          localStorage.setItem('edubenin_active_school_id', data[0].id);
        }
      } else {
        // No school exists in database: do not inject dummy school!
        setRealSchoolId(null);
        localStorage.removeItem('edubenin_active_school_id');
      }
    });
    supabase.from('profiles').select('id').limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setRealProfileId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    // Helper to get role
    const getRoleForSupabaseUser = async (email: string) => {
      const pendingRole = localStorage.getItem("pending_google_role");
      if (pendingRole) {
        localStorage.removeItem("pending_google_role");
        return pendingRole as any;
      }
      const inv = await findInvitationForEmail(email);
      if (inv?.role) return inv.role as any;
      return null;
    };

    // Fetch real profile from Supabase
    const fetchSupabaseProfile = async (sessionUser: any) => {
      try {
        const pendingRole = localStorage.getItem("pending_google_role");
        const userEmail = sessionUser.email ? sessionUser.email.toLowerCase().trim() : "";

        // Check if there is an active invitation for this user's email across all sources
        let invitedSchoolId: string | null = null;
        let invitedRole: string | null = null;
        if (userEmail) {
          const invMatch = await findInvitationForEmail(userEmail);
          if (invMatch) {
            invitedSchoolId = invMatch.schoolId;
            invitedRole = invMatch.role;
          }
        }

        // Fetch current profile if it exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, school_id, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (pendingRole) {
          localStorage.removeItem("pending_google_role");

          if (pendingRole === 'SCHOOL_ADMIN') {
            // For director: keep existing school or leave null for onboarding
            let schoolId = profile?.school_id || null;
            try {
              await supabase.from('profiles').upsert({
                id: sessionUser.id,
                email: sessionUser.email,
                role: 'SCHOOL_ADMIN',
                school_id: schoolId,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
                avatar_url: sessionUser.user_metadata?.avatar_url
              });
            } catch (e) {}
          } else if (pendingRole === 'PARENT') {
            // Explicitly selected parent role
            try {
              await supabase.from('profiles').upsert({
                id: sessionUser.id,
                email: sessionUser.email,
                role: 'PARENT',
                school_id: null,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
                avatar_url: sessionUser.user_metadata?.avatar_url
              });
            } catch (e) {}
          } else {
            // Staff / Invited role selected (e.g. TEACHER, DIRECTOR_OF_STUDIES, CASHIER, SECRETARY, etc.)
            const activeFallback = localStorage.getItem('edubenin_active_school_id') || realSchoolId;
            const targetSchoolId = invitedSchoolId || profile?.school_id || activeFallback;

            if (targetSchoolId || invitedRole) {
              // VERIFIED: User has an invitation or existing school!
              const targetRole = pendingRole || invitedRole || profile?.role || 'TEACHER';
              try {
                await supabase.from('profiles').upsert({
                  id: sessionUser.id,
                  email: sessionUser.email,
                  role: targetRole,
                  school_id: targetSchoolId || null,
                  full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
                  avatar_url: sessionUser.user_metadata?.avatar_url
                });
              } catch (e) {}
              if (targetSchoolId) {
                localStorage.setItem('edubenin_active_school_id', targetSchoolId);
              }
            } else {
              // Gracefully associate with active fallback school if available
              const targetRole = pendingRole || 'TEACHER';
              const fallbackSchoolId = localStorage.getItem('edubenin_active_school_id') || realSchoolId;
              try {
                await supabase.from('profiles').upsert({
                  id: sessionUser.id,
                  email: sessionUser.email,
                  role: targetRole,
                  school_id: fallbackSchoolId || null,
                  full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
                  avatar_url: sessionUser.user_metadata?.avatar_url
                });
              } catch (e) {}
              if (fallbackSchoolId) {
                localStorage.setItem('edubenin_active_school_id', fallbackSchoolId);
              }
            }
          }
        }

        // Re-fetch profile to get up-to-date state
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('role, full_name, school_id, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle();

        const currentProfile = updatedProfile || profile;

        if (currentProfile) {
          if (sessionUser.email === 'contact.tchok@gmail.com' && currentProfile.role !== 'SUPER_ADMIN') {
             await supabase.from('profiles').update({ role: 'SUPER_ADMIN', school_id: null }).eq('id', sessionUser.id);
             currentProfile.role = 'SUPER_ADMIN';
             currentProfile.school_id = null;
          }

          let resolvedSchoolId = currentProfile.school_id || invitedSchoolId;
          
          // Verify if the assigned school actually exists in schools table
          if (resolvedSchoolId) {
            try {
              const { data: existingSchool } = await supabase.from('schools').select('id, name').eq('id', resolvedSchoolId).maybeSingle();
              if (!existingSchool) {
                // School was deleted by Super Admin!
                resolvedSchoolId = null;
                localStorage.removeItem('edubenin_active_school_id');
                localStorage.removeItem('edubenin_active_school_name');
                await supabase.from('profiles').update({ school_id: null }).eq('id', sessionUser.id);
              }
            } catch (e) {}
          }

          // ONLY for staff (non-director), if schoolId is missing, check active school
          if (!resolvedSchoolId && currentProfile.role !== 'SUPER_ADMIN' && currentProfile.role !== 'PARENT' && currentProfile.role !== 'SCHOOL_ADMIN') {
            const activeFallback = localStorage.getItem('edubenin_active_school_id');
            if (activeFallback) {
              resolvedSchoolId = activeFallback;
            }
          }

          // If SCHOOL_ADMIN has no school (new or school deleted), do NOT invent a fallback school!
          // Leave resolvedSchoolId undefined so onboarding is properly triggered.
          const finalSchoolId = (currentProfile.role === 'SUPER_ADMIN' || currentProfile.role === 'PARENT' || (currentProfile.role === 'SCHOOL_ADMIN' && !resolvedSchoolId)) 
            ? undefined 
            : (resolvedSchoolId || undefined);

          let resolvedSchoolName: string | undefined = undefined;
          if (finalSchoolId) {
            localStorage.setItem('edubenin_active_school_id', finalSchoolId);
            try {
              const { data: sData } = await supabase.from('schools').select('name').eq('id', finalSchoolId).maybeSingle();
              if (sData?.name) {
                resolvedSchoolName = sData.name;
                localStorage.setItem('edubenin_active_school_name', sData.name);
              }
            } catch (e) {}
          } else if (currentProfile.role === 'SCHOOL_ADMIN') {
            localStorage.removeItem('edubenin_active_school_id');
            localStorage.removeItem('edubenin_active_school_name');
          }

          // If schoolName is still not found, check fallback active name
          if (!resolvedSchoolName) {
            resolvedSchoolName = localStorage.getItem('edubenin_active_school_name') || undefined;
          }

          // Keep mock_db_profiles in sync with connected user
          try {
            const localProfiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
            const idx = localProfiles.findIndex((p: any) => p.id === sessionUser.id || (p.email && p.email.toLowerCase() === userEmail));
            const profObj = {
              id: sessionUser.id,
              email: userEmail,
              full_name: currentProfile.full_name || sessionUser.user_metadata?.full_name || userEmail.split('@')[0],
              role: currentProfile.role,
              school_id: finalSchoolId || null,
              is_connected: true,
              connected_at: new Date().toISOString()
            };
            if (idx >= 0) localProfiles[idx] = { ...localProfiles[idx], ...profObj };
            else localProfiles.push(profObj);
            localStorage.setItem('mock_db_profiles', JSON.stringify(localProfiles));
          } catch (e) {}

          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: currentProfile.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: currentProfile.role as any,
            schoolId: finalSchoolId,
            schoolName: resolvedSchoolName,
            avatar: currentProfile.avatar_url,
          });
        } else {
          // Profile was deleted or not created yet
          const chosenRole = (localStorage.getItem("pending_google_role") as any) || (await getRoleForSupabaseUser(sessionUser.email || "")) || invitedRole;
          
          if (!chosenRole) {
            setUser(null);
            setIsLoading(false);
            return;
          }

          // Check if an active school exists in localStorage (e.g. just created during onboarding)
          const activeSchoolFromStorage = invitedSchoolId || localStorage.getItem('edubenin_active_school_id') || undefined;

          // For SUPER_ADMIN or PARENT, schoolId is undefined
          // For SCHOOL_ADMIN, if they have an active school in storage, use it; otherwise undefined to prompt onboarding
          const fallbackSchoolId = (chosenRole === 'SUPER_ADMIN' || chosenRole === 'PARENT') 
            ? undefined 
            : activeSchoolFromStorage;

          let resolvedSchoolName: string | undefined = undefined;
          if (fallbackSchoolId) {
            try {
              const { data: sData } = await supabase.from('schools').select('name').eq('id', fallbackSchoolId).maybeSingle();
              if (sData?.name) {
                resolvedSchoolName = sData.name;
                localStorage.setItem('edubenin_active_school_name', sData.name);
              }
            } catch (e) {}
          }

          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
            role: chosenRole,
            schoolId: fallbackSchoolId,
            schoolName: resolvedSchoolName || localStorage.getItem('edubenin_active_school_name') || undefined,
          });
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Check Supabase auth state first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user);
      } else {
        // 2. Fallback to local storage (sanitized and validated)
        const validated = validateStoredUser(localStorage.getItem("edubenin_auth"));
        if (validated) {
          setUser(validated);
        } else {
          localStorage.removeItem("edubenin_auth");
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSupabaseProfile(session.user);
        localStorage.removeItem("edubenin_auth"); // Clear mock user if logged in with Supabase
      } else {
        // If logged out from Supabase, validate local mock user or reset
        const validated = validateStoredUser(localStorage.getItem("edubenin_auth"));
        if (validated) {
          setUser(validated);
        } else {
          localStorage.removeItem("edubenin_auth");
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async (preferredRole?: string, preferredEmail?: string) => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {}
    localStorage.removeItem("edubenin_auth");

    const roleToUse = preferredRole || localStorage.getItem("pending_google_role") || null;
    if (roleToUse) {
      localStorage.setItem("pending_google_role", roleToUse);
    }
    const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder-project') || import.meta.env.VITE_SUPABASE_URL.includes('YOUR_SUPABASE_URL');

    let googleEmail = (preferredEmail || localStorage.getItem("pending_google_email") || "").trim().toLowerCase();
    if (isPlaceholder) {
      if (!googleEmail) {
        // Check for any invited email matching roleToUse
        if (roleToUse) {
          try {
            const localInvs = JSON.parse(localStorage.getItem('mock_db_invitations') || '[]');
            const matchingInv = localInvs.find((i: any) => i.role === roleToUse);
            if (matchingInv?.email) {
              googleEmail = matchingInv.email.toLowerCase().trim();
            }
          } catch (e) {}
        }
        // Fallback email based on role
        if (!googleEmail) {
          switch (roleToUse) {
            case 'SCHOOL_ADMIN': googleEmail = "directeur.benin@gmail.com"; break;
            case 'DIRECTOR_OF_STUDIES': googleEmail = "directeur.etudes@gmail.com"; break;
            case 'TEACHER': googleEmail = "enseignant.benin@gmail.com"; break;
            case 'CASHIER': googleEmail = "caisse.benin@gmail.com"; break;
            case 'SECRETARY': googleEmail = "secretaire.benin@gmail.com"; break;
            case 'SUPERVISOR': googleEmail = "surveillant.benin@gmail.com"; break;
            case 'PARENT': googleEmail = "parent.benin@gmail.com"; break;
            default: googleEmail = "directeur.benin@gmail.com"; break;
          }
        }
      }

      if (googleEmail) {
        localStorage.removeItem("pending_google_email");
        localStorage.removeItem("pending_google_role");

        const inv = await findInvitationForEmail(googleEmail);
        const effectiveRole = roleToUse || inv?.role || (googleEmail === 'contact.tchok@gmail.com' ? 'SUPER_ADMIN' : 'SCHOOL_ADMIN');
        const activeSchoolFallback = localStorage.getItem('edubenin_active_school_id') || realSchoolId;
        const targetSchoolId = inv?.schoolId || activeSchoolFallback;

        const schoolIdForUser = (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'PARENT')
          ? undefined
          : (inv?.schoolId || targetSchoolId || undefined);

        const schoolNameForUser = await resolveSchoolName(schoolIdForUser) || inv?.schoolName || localStorage.getItem('edubenin_active_school_name') || undefined;

        const mockGoogleUser: User = {
          id: 'goog_' + Math.random().toString(36).substring(2, 10),
          email: googleEmail,
          name: googleEmail.split('@')[0],
          role: effectiveRole as any,
          schoolId: schoolIdForUser,
          schoolName: schoolNameForUser
        };

        if (mockGoogleUser.schoolId) {
          localStorage.setItem('edubenin_active_school_id', mockGoogleUser.schoolId);
        }
        if (schoolNameForUser) {
          localStorage.setItem('edubenin_active_school_name', schoolNameForUser);
        }

        // Sync into mock_db_profiles as active connected profile
        try {
          const localProfiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
          const idx = localProfiles.findIndex((p: any) => p.email && p.email.toLowerCase().trim() === googleEmail);
          const profObj = {
            id: mockGoogleUser.id,
            email: googleEmail,
            full_name: mockGoogleUser.name,
            role: effectiveRole,
            school_id: schoolIdForUser || null,
            school_name: schoolNameForUser || null,
            is_connected: true,
            connected_at: new Date().toISOString()
          };
          if (idx >= 0) localProfiles[idx] = { ...localProfiles[idx], ...profObj };
          else localProfiles.push(profObj);
          localStorage.setItem('mock_db_profiles', JSON.stringify(localProfiles));
        } catch(e) {}

        setUser(mockGoogleUser);
        localStorage.setItem("edubenin_auth", JSON.stringify(mockGoogleUser));
        return;
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      }
    });
    if (error) {
      console.error("Google Auth Error:", error.message);
      throw error;
    }
  };

  const updateUserSchool = (schoolId: string, schoolName?: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, schoolId, ...(schoolName ? { schoolName } : {}) };
      localStorage.setItem("edubenin_auth", JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem("edubenin_active_school_id", schoolId);
  };

  const login = async (email: string, fullName?: string, password?: string, role?: string) => {
    let cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail && role) {
      switch (role) {
        case 'SCHOOL_ADMIN': cleanEmail = 'admin@school.com'; break;
        case 'DIRECTOR_OF_STUDIES': cleanEmail = 'director@school.com'; break;
        case 'SECRETARY': cleanEmail = 'secretary@school.com'; break;
        case 'CASHIER': cleanEmail = 'caisse@school.com'; break;
        case 'SUPERVISOR': cleanEmail = 'surveillant@school.com'; break;
        case 'PARENT': cleanEmail = 'parent@mail.com'; break;
        case 'TEACHER': cleanEmail = 'teacher@school.com'; break;
      }
    }
    let foundUser = MOCK_USERS[cleanEmail] || MOCK_USERS[email];
    let mockPassword = password || "password123";

    // Check if an invitation exists for this email across all sources
    const inv = await findInvitationForEmail(cleanEmail);
    const invitedSchoolId = inv?.schoolId || null;
    const invitedRole = inv?.role || null;

    // Do NOT default to PARENT! Proper classification:
    const effectiveRole = (role || invitedRole || foundUser?.role) as any;
    if (!effectiveRole) {
      throw new Error("Veuillez sélectionner votre profil pour vous connecter.");
    }

    const activeSchoolFallback = invitedSchoolId || localStorage.getItem('edubenin_active_school_id') || realSchoolId;
    
    // For SCHOOL_ADMIN: if no real school exists in database, do NOT assign a fallback school!
    let schoolIdForUser: string | undefined = undefined;
    if (effectiveRole !== 'SUPER_ADMIN' && effectiveRole !== 'PARENT') {
      if (effectiveRole === 'SCHOOL_ADMIN') {
        schoolIdForUser = activeSchoolFallback || undefined;
      } else {
        schoolIdForUser = invitedSchoolId || activeSchoolFallback || foundUser?.schoolId || undefined;
      }
    }

    let schoolNameForUser: string | undefined = undefined;
    if (schoolIdForUser) {
      schoolNameForUser = await resolveSchoolName(schoolIdForUser);
    }
    if (!schoolNameForUser) {
      schoolNameForUser = inv?.schoolName || localStorage.getItem('edubenin_active_school_name') || undefined;
    }

    let userToSet: User = foundUser ? 
      { ...foundUser, email: cleanEmail, role: effectiveRole, schoolId: schoolIdForUser, schoolName: schoolNameForUser }
      : {
        id: "00000000-0000-4000-8000-000000000000",
        email: cleanEmail,
        name: fullName || cleanEmail.split("@")[0],
        role: effectiveRole,
        schoolId: schoolIdForUser,
        schoolName: schoolNameForUser
      };

    if (userToSet.schoolId) {
      localStorage.setItem('edubenin_active_school_id', userToSet.schoolId);
    } else if (effectiveRole === 'SCHOOL_ADMIN') {
      localStorage.removeItem('edubenin_active_school_id');
      localStorage.removeItem('edubenin_active_school_name');
    }
    if (schoolNameForUser) {
      localStorage.setItem('edubenin_active_school_name', schoolNameForUser);
    }

    // Sync into mock_db_profiles as active connected profile
    try {
      const localProfiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
      const idx = localProfiles.findIndex((p: any) => (p.id && p.id === userToSet.id) || (p.email && p.email.toLowerCase().trim() === cleanEmail));
      const profObj = {
        id: userToSet.id,
        email: cleanEmail,
        full_name: userToSet.name,
        role: effectiveRole,
        school_id: schoolIdForUser || null,
        school_name: schoolNameForUser || null,
        is_connected: true,
        connected_at: new Date().toISOString()
      };
      if (idx >= 0) localProfiles[idx] = { ...localProfiles[idx], ...profObj };
      else localProfiles.push(profObj);
      localStorage.setItem('mock_db_profiles', JSON.stringify(localProfiles));
    } catch(e) {}

    if (foundUser || email.includes("test")) {
       localStorage.setItem("is_test_account", "true");
       setUser(userToSet);
       localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));
       return;
    } else {
       localStorage.removeItem("is_test_account");
    }

    try {
      // 1. Try to login
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: mockPassword });
      
      if (authError && (authError.message.includes('Invalid login credentials') || authError.message.includes('Invalid') || authError.status === 400)) {
         // 2. Try to signup
         const signupRes = await supabase.auth.signUp({ email: cleanEmail, password: mockPassword });
         authData = signupRes.data;
      }
      
      if (authData?.user) {
         userToSet.id = authData.user.id;
         // Upsert profile
         try {
           await supabase.from('profiles').upsert({
             id: userToSet.id,
             email: cleanEmail,
             full_name: userToSet.name,
             role: userToSet.role,
             school_id: userToSet.schoolId || null
           });
         } catch (e) {}
         
         setUser(userToSet);
         localStorage.removeItem("edubenin_auth");
         return; // Success!
      }
    } catch (e) {
      console.error("Supabase auth failed, falling back to local mock", e);
    }
    
    // Fallback if Supabase fails (e.g. no internet)
    setUser(userToSet);
    localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    localStorage.removeItem("edubenin_auth");
    localStorage.removeItem("is_test_account");
    localStorage.removeItem("pending_google_role");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, updateUserSchool }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
