"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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
  const client = useMemo(
    () =>
      new ApiClient({
        baseUrl,
        appToken,
        store: typeof window === "undefined" ? undefined : new LocalStorageTokenStore(storageKey),
      }),
    [baseUrl, appToken, storageKey],
  );
  const [user, setUser] = useState<UserOut | null>(null);
  const [ready, setReady] = useState(false);

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
      await client.login(email, password);
      await refreshUser();
    },
    [client, refreshUser],
  );

  const logout = useCallback(async () => {
    await client.logout();
    setUser(null);
  }, [client]);

  const value = useMemo(
    () => ({ client, user, ready, login, logout, refreshUser }),
    [client, user, ready, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
