import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, fullName?: string, password?: string, role?: string) => void; // Keeps mock support
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock Users for testing
const MOCK_USERS: Record<string, User> = {
  "admin@school.com": {
    id: "admin_1",
    email: "admin@school.com",
    name: "Directeur Ecole A",
    role: "SCHOOL_ADMIN",
    schoolId: "school_1",
  },
  "caisse@school.com": {
    id: "caisse_1",
    email: "caisse@school.com",
    name: "Caisse Ecole",
    role: "CASHIER",
    schoolId: "school_1",
  },
  "secretary@school.com": {
    id: "sec_1",
    email: "secretary@school.com",
    name: "Secrétaire Ecole",
    role: "SECRETARY",
    schoolId: "school_1",
  },
  "parent@mail.com": {
    id: "parent_1",
    email: "parent@mail.com",
    name: "Parent E.",
    role: "PARENT",
  },
  "prof@school.com": {
    id: "prof_1",
    email: "prof@school.com",
    name: "Professeur P.",
    role: "TEACHER",
    schoolId: "school_1",
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Helper to get role
    const getRoleForSupabaseUser = (email: string) => {
      const pendingRole = localStorage.getItem("pending_google_role");
      if (pendingRole) {
        localStorage.removeItem("pending_google_role");
        return pendingRole as any;
      }
      return "PARENT";
    };

    // Fetch real profile from Supabase
    const fetchSupabaseProfile = async (sessionUser: any) => {};

    // 1. Check Supabase auth state first
    // Mock init
const stored = localStorage.getItem("edubenin_auth");
if (stored) setUser(JSON.parse(stored));
setIsLoading(false);


    // Listen to Supabase auth changes
    // Mock listener

    return () => {};
  }, []);

  const loginWithGoogle = async () => {
    alert("Google Sign-In Mocké");
  };

  const login = (email: string, fullName?: string, password?: string, role?: string) => {
    const foundUser = MOCK_USERS[email];
    if (foundUser) {
      // If a role is explicitly requested, we can update the mock user's role
      const userToSet = role ? { ...foundUser, role: role as any } : foundUser;
      setUser(userToSet);
      localStorage.setItem("edubenin_auth", JSON.stringify(userToSet));
    } else {
      // Auto-create a mock user if not found just to not block testing
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name: fullName || email.split("@")[0],
        role: (role as any) || "PARENT"
      };
      setUser(newUser);
      localStorage.setItem("edubenin_auth", JSON.stringify(newUser));
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("edubenin_auth");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
