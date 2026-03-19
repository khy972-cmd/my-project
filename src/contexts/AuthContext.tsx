import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { TEST_MODE_KEY, TEST_ROLE_KEY } from "@/constants/storageKeys";
import { type AppRole } from "@/lib/roles";
import { hasAuthCodeInUrl, stripAuthCallbackParamsFromUrl } from "@/lib/authUrl";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
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
  initialized: false,
  isTestMode: false,
  testRole: "worker",
  setTestMode: () => {},
  setTestRole: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);
  // Production auth mode: force-disable legacy local test bypass.
  const isTestMode = false;
  const testRole: AppRole = "worker";
  const setTestMode = () => {};
  const setTestRole = () => {};

  useEffect(() => {
    let isMounted = true;
    const finalizeInitialization = () => {
      if (!isMounted || initializedRef.current) return;
      initializedRef.current = true;
      setInitialized(true);
    };
    const loadingTimeout = window.setTimeout(finalizeInitialization, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
      }
    );

    const initializeSession = async () => {
      let shouldStripAuthParams = false;
      let nextSession: Session | null = null;

      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (existingSession) {
        nextSession = existingSession;
      } else if (hasAuthCodeInUrl()) {
        const code = new URL(window.location.href).searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            nextSession = data.session ?? null;
            shouldStripAuthParams = true;
          } else if (import.meta.env.DEV) {
            console.warn("[auth] failed to exchange auth code", error);
          }
        }
      }

      if (!isMounted) return;
      setSession(nextSession);

      if (shouldStripAuthParams) {
        stripAuthCallbackParamsFromUrl();
      }
    };

    initializeSession()
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
      })
      .finally(() => {
        if (!isMounted) return;
        window.clearTimeout(loadingTimeout);
        finalizeInitialization();
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
      loading: !initialized,
      initialized,
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
