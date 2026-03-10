import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { TEST_MODE_KEY, TEST_ROLE_KEY } from "@/constants/storageKeys";
import { type AppRole } from "@/lib/roles";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isTestMode: boolean;
  testRole: AppRole;
  setTestMode: (v: boolean) => void;
  setTestRole: (r: AppRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isTestMode: false,
  testRole: "worker",
  setTestMode: () => {},
  setTestRole: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Production auth mode: force-disable legacy local test bypass.
  const isTestMode = false;
  const testRole: AppRole = "worker";
  const setTestMode = () => {};
  const setTestRole = () => {};

  useEffect(() => {
    let isMounted = true;
    const loadingTimeout = window.setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        setSession(session);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
      })
      .finally(() => {
        if (!isMounted) return;
        window.clearTimeout(loadingTimeout);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem(TEST_MODE_KEY);
      localStorage.removeItem(TEST_ROLE_KEY);
    } catch {
      // ignore storage cleanup errors
    }
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      isTestMode,
      testRole,
      setTestMode,
      setTestRole,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
