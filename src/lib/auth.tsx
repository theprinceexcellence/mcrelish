import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, AUTH_EXPIRED_EVENT, getToken, setToken, type Role, type SessionUser } from "@/lib/api";

type Profile = { id: string; full_name: string; phone: string };
type AuthUser = { id: string; email: string; roles: Role[] };
type Session = { token: string; user: SessionUser };

type AuthValue = {
  user: AuthUser | null;
  profile: Profile | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  /** Used after a password reset, which signs the customer in. */
  applySession: (session: Session) => void;
  updateProfile: (fullName: string, phone: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) { setAccount(null); return; }
    try {
      setAccount((await api<{ user: SessionUser }>("/api/auth/me")).user);
    } catch {
      // An invalid token is cleared by api(); a network error keeps the saved session for the next try.
      if (!getToken()) setAccount(null);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void load().finally(() => { if (alive) setReady(true); });
    const onExpired = () => setAccount(null);
    const onStorage = (e: StorageEvent) => { if (e.key === "mcrelish-session") void load(); };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", onStorage);
    return () => { alive = false; window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired); window.removeEventListener("storage", onStorage); };
  }, [load]);

  const applySession = useCallback((session: Session) => { setToken(session.token); setAccount(session.user); }, []);

  const value = useMemo<AuthValue>(() => ({
    user: account ? { id: account.id, email: account.email, roles: account.roles } : null,
    profile: account ? { id: account.id, full_name: account.full_name, phone: account.phone } : null,
    ready,
    signIn: async (email, password) => applySession(await api<Session>("/api/auth/login", { body: { email, password } })),
    signUp: async (email, password, fullName) => applySession(await api<Session>("/api/auth/signup", { body: { email, password, full_name: fullName } })),
    signInWithGoogle: async (credential) => applySession(await api<Session>("/api/auth/google", { body: { credential } })),
    applySession,
    updateProfile: async (fullName, phone) => { setAccount((await api<{ user: SessionUser }>("/api/auth/profile", { body: { full_name: fullName, phone } })).user); },
    refreshProfile: load,
    signOut: async () => {
      try { await api("/api/auth/logout", { method: "POST", body: {} }); } catch { /* the session is dropped locally either way */ }
      setToken(null);
      setAccount(null);
    },
  }), [account, ready, load, applySession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
