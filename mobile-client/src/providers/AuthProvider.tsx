import type { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import api from "@/lib/api";
import { authRedirectUrl, supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  identityError: string | null;
};

type AuthContextValue = AuthState & {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  resendSignupConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeAuthRedirect: (url: string) => Promise<{ type?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const registeredUserIds = new Set<string>();
const completedRedirects = new Map<string, Promise<{ type?: string }>>();

async function ensureBackendUser() {
  try {
    await api.get("/user/me");
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error;
    await api.post("/user/register");
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    identityError: null,
  });

  useEffect(() => {
    let mounted = true;
    let generation = 0;

    const resolveSession = async (session: Session | null) => {
      const currentGeneration = ++generation;
      const user = session?.user ?? null;
      setState({
        session,
        user,
        loading: !!user && !registeredUserIds.has(user.id),
        identityError: null,
      });
      if (!user || registeredUserIds.has(user.id)) return;

      try {
        await ensureBackendUser();
        registeredUserIds.add(user.id);
      } catch {
        if (mounted && currentGeneration === generation) {
          setState((current) => ({
            ...current,
            loading: false,
            identityError: "We couldn't connect your account to Spotly. Try again.",
          }));
        }
        return;
      }

      if (mounted && currentGeneration === generation) {
        setState((current) => ({ ...current, loading: false, identityError: null }));
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      setTimeout(() => {
        if (mounted) void resolveSession(session);
      }, 0);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          setState({
            session: null,
            user: null,
            loading: false,
            identityError: "We couldn't restore your session. Sign in again.",
          });
          return;
        }
        void resolveSession(session);
      })
      .catch(() => {
        if (mounted) {
          setState({
            session: null,
            user: null,
            loading: false,
            identityError: "We couldn't restore your session. Sign in again.",
          });
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const completeAuthRedirect = useCallback((url: string) => {
    const previous = completedRedirects.get(url);
    if (previous) return previous;

    const completion = (async () => {
      const parsed = new URL(url);
      if (
        parsed.protocol !== "com.pingfloyd.spotly:" ||
        parsed.hostname !== "auth" ||
        parsed.pathname !== "/callback"
      ) {
        throw new Error("Invalid Spotly authentication redirect.");
      }
      const query = parsed.searchParams;
      const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
      const type = query.get("type") ?? fragment.get("type") ?? undefined;
      const redirectError = query.get("error") ?? fragment.get("error");
      const description =
        query.get("error_description") ?? fragment.get("error_description");
      if (redirectError || description) {
        throw new Error(description ?? redirectError ?? "Authentication failed.");
      }

      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else {
        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
      }
      return { type };
    })();

    completedRedirects.clear();
    completedRedirects.set(url, completion);
    void completion.catch(() => {
      if (completedRedirects.get(url) === completion) completedRedirects.delete(url);
    });
    return completion;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authRedirectUrl,
          data: { full_name: name?.trim() ?? "" },
        },
      });
      if (error) throw error;
      return { requiresEmailConfirmation: !data.session };
    },
    [],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUrl,
    });
    if (error) throw error;
  }, []);

  const resendSignupConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: authRedirectUrl },
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authRedirectUrl, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error("Google sign-in did not return a URL.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);
    if (result.type !== "success") return false;
    await completeAuthRedirect(result.url);
    return true;
  }, [completeAuthRedirect]);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signInWithEmail,
      signUpWithEmail,
      resendSignupConfirmation,
      requestPasswordReset,
      signInWithGoogle,
      updatePassword,
      signOut,
      completeAuthRedirect,
    }),
    [
      state,
      signInWithEmail,
      signUpWithEmail,
      resendSignupConfirmation,
      requestPasswordReset,
      signInWithGoogle,
      updatePassword,
      signOut,
      completeAuthRedirect,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
