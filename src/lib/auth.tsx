import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEMO_USERS, ROLE_ACCESS, type Role } from "./mock-data";

export interface AuthUser {
  username: string;
  name: string;
  role: Role;
  roleLabel: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (u: string, p: string) => { ok: boolean; error?: string };
  logout: () => void;
  canView: (k: string) => boolean;
  canEdit: (k: string) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "nestle_dp_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = (username: string, password: string) => {
    const u = DEMO_USERS.find(x => x.username === username && x.password === password);
    if (!u) return { ok: false, error: "Usuario o contraseña incorrectos" };
    const au: AuthUser = { username: u.username, name: u.name, role: u.role as Role, roleLabel: u.roleLabel };
    localStorage.setItem(KEY, JSON.stringify(au));
    setUser(au);
    return { ok: true };
  };

  const logout = () => { localStorage.removeItem(KEY); setUser(null); };

  const canView = (k: string) => !user ? false : ROLE_ACCESS[user.role].canView.includes(k);
  const canEdit = (k: string) => !user ? false : ROLE_ACCESS[user.role].canEdit.includes(k);

  if (!ready) return null;
  return <Ctx.Provider value={{ user, login, logout, canView, canEdit }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fuera de AuthProvider");
  return c;
}
