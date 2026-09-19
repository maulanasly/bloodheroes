"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ApiClient,
  type TokenPair,
  type TokenStore,
  type UserOut,
} from "@bloodheroes/api-client";
import { getMe } from "@bloodheroes/api-client";

class LocalStorageTokenStore implements TokenStore {
  private key: string;
  constructor(key: string) {
    this.key = key;
  }
  load(): TokenPair | null {
    try {
      const raw = window.localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as TokenPair) : null;
    } catch {
      return null;
    }
  }
  save(tokens: TokenPair | null): void {
    try {
      if (tokens) window.localStorage.setItem(this.key, JSON.stringify(tokens));
      else window.localStorage.removeItem(this.key);
    } catch {
      /* storage unavailable */
    }
  }
}

interface AuthContextValue {
  client: ApiClient;
  user: UserOut | null;
  ready: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  baseUrl,
  appToken,
  storageKey,
  children,
}: {
  baseUrl: string;
  appToken: string;
  storageKey: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const [user, setUser] = useState<UserOut | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const sessionExpiredRef = useRef(false);
  const markExpired = useCallback(() => {
    if (sessionExpiredRef.current) return;
    sessionExpiredRef.current = true;
    setSessionExpired(true);
    const next = encodeURIComponent(pathRef.current);
    router.replace(`/login?expired=1&next=${next}`);
  }, [router]);
  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl,
        appToken,
        store: typeof window === "undefined" ? undefined : new LocalStorageTokenStore(storageKey),
        onAuthFailure: () => markExpired(),
      }),
    [baseUrl, appToken, storageKey, markExpired],
  );

  const refreshUser = useCallback(async () => {
    if (!client.isAuthenticated()) {
      setUser(null);
      return;
    }
    try {
      setUser(await getMe(client));
    } catch {
      setUser(null);
    }
  }, [client]);

  useEffect(() => {
    refreshUser().finally(() => setReady(true));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      sessionExpiredRef.current = false;
      setSessionExpired(false);
      await client.login(email, password);
      await refreshUser();
    },
    [client, refreshUser],
  );

  const logout = useCallback(async () => {
    await client.logout();
    setUser(null);
    sessionExpiredRef.current = false;
    setSessionExpired(false);
  }, [client]);

  const value = useMemo(
    () => ({ client, user, ready, sessionExpired, login, logout, refreshUser }),
    [client, user, ready, sessionExpired, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
