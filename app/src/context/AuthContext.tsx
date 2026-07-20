import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, apiErrorMessage } from "../api/client";
import { storage } from "../api/storage";
import type { User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; avatarEmoji?: string; estimatedMonthlyIncome?: number }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string) {
  await storage.setItem("mc_token", token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      await storage.removeItem("mc_token");
    }
  }

  useEffect(() => {
    (async () => {
      const token = await storage.getItem("mc_token");
      if (token) await refreshUser();
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await persistSession(data.token);
      setUser(data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "No pudimos iniciar sesión."));
    }
  }

  async function register(email: string, password: string, name: string) {
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      await persistSession(data.token);
      setUser(data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "No pudimos crear tu cuenta."));
    }
  }

  async function loginWithGoogle(idToken: string) {
    try {
      const { data } = await api.post("/auth/google", { idToken });
      await persistSession(data.token);
      setUser(data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "No pudimos iniciar sesión con Google."));
    }
  }

  async function loginWithApple(identityToken: string, name?: string) {
    try {
      const { data } = await api.post("/auth/apple", { identityToken, name });
      await persistSession(data.token);
      setUser(data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "No pudimos iniciar sesión con Apple."));
    }
  }

  async function logout() {
    await storage.removeItem("mc_token");
    setUser(null);
  }

  async function updateProfile(payload: { name?: string; avatarEmoji?: string; estimatedMonthlyIncome?: number }) {
    const { data } = await api.patch("/auth/me", payload);
    setUser(data.user);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, loginWithApple, logout, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
