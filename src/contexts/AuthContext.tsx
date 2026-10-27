import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Profile = Tables<"profiles">;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileUnavailable: boolean;
  signIn: (email: string, password: string) => Promise<Profile | null>;
  signUp: (fullName: string, email: string, password: string, accountType: "buyer" | "seller", returnTo?: string) => Promise<{ confirmationRequired: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  saveProfile: (fullName: string, phone: string, publicDisplayName?: string) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const requestSequence = useRef(0);

  const loadProfile = useCallback(async (currentUser: User | null): Promise<Profile | null> => {
    const sequence = ++requestSequence.current;
    if (!currentUser) {
      setProfile(null);
      setProfileUnavailable(false);
      setLoading(false);
      return null;
    }

    const profileResult = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
    if (sequence !== requestSequence.current) return null;
    setProfile(profileResult.error ? null : profileResult.data);
    setProfileUnavailable(Boolean(profileResult.error));
    setLoading(false);
    return profileResult.error ? null : profileResult.data;
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        requestSequence.current += 1;
        setProfile(null);
        setProfileUnavailable(false);
        setLoading(false);
      } else {
        // Defer Supabase queries out of its auth callback to avoid holding its internal lock.
        window.setTimeout(() => {
          if (mounted) void loadProfile(nextSession.user);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      requestSequence.current += 1;
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    setSession(data.session);
    setUser(data.session?.user ?? null);
    return loadProfile(data.session?.user ?? null);
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return refreshProfile();
  }, [refreshProfile]);

  const signUp = useCallback(async (fullName: string, email: string, password: string, accountType: "buyer" | "seller", returnTo?: string) => {
    const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : null;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), signup_account_type: accountType },
        emailRedirectTo: `${window.location.origin}${safeReturnTo ?? (accountType === "seller" ? "/seller/dashboard" : "/buyer/dashboard")}`,
      },
    });
    if (error) throw error;
    if (data.session) await refreshProfile();
    return { confirmationRequired: !data.session };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const saveProfile = useCallback(async (fullName: string, phone: string, publicDisplayName?: string) => {
    if (!user) throw new Error("Sign in to update your account.");
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        ...(publicDisplayName === undefined ? {} : { public_display_name: publicDisplayName.trim() || null }),
      })
      .eq("id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    setProfile(data);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    profile,
    loading,
    profileUnavailable,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    saveProfile,
    refreshProfile,
  }), [session, user, profile, loading, profileUnavailable, signIn, signUp,
    signOut, sendPasswordReset, updatePassword, saveProfile, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function getAuthErrorMessage(error: unknown): string {
  const candidate = error && typeof error === "object" ? error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
    cause?: unknown;
  } : null;
  const name = typeof candidate?.name === "string" ? candidate.name : "UnknownError";
  const rawMessage = error instanceof Error
    ? error.message
    : typeof candidate?.message === "string" ? candidate.message : String(error ?? "Unknown error");
  const message = rawMessage.toLowerCase();
  const status = typeof candidate?.status === "number" ? candidate.status : undefined;

  // Keep useful diagnostics in development, but never log credential-like strings or URLs.
  if (import.meta.env.DEV) {
    const sanitizeDiagnostic = (value: string) => value
      .replace(/https?:\/\/[^\s"'`]+/gi, "[URL]")
      .replace(/\b(?:Bearer\s+)?(?:sb_publishable_[\w-]+|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/gi, "[REDACTED CREDENTIAL]");
    const cause = candidate?.cause && typeof candidate.cause === "object"
      ? candidate.cause as { name?: unknown; message?: unknown }
      : null;
    console.error("[auth] Supabase authentication request failed", {
      name,
      message: sanitizeDiagnostic(rawMessage).slice(0, 500),
      status,
      code: typeof candidate?.code === "string" ? candidate.code : undefined,
      causeName: typeof cause?.name === "string" ? cause.name : undefined,
      causeMessage: typeof cause?.message === "string"
        ? sanitizeDiagnostic(cause.message).slice(0, 500)
        : undefined,
    });
  }

  if (message.includes("invalid login credentials")) return "That email and password combination was not recognized.";
  if (message.includes("email not confirmed")) return "Confirm your email using the link we sent, then sign in.";
  if (message.includes("user already registered")) return "An account already exists for this email. Try signing in instead.";
  if (message.includes("password should be at least") || message.includes("weak password")) {
    return "Choose a stronger password with at least 8 characters.";
  }
  if (message.includes("rate limit") || message.includes("too many requests") || status === 429) {
    return "Too many attempts. Wait a little while and try again.";
  }
  if (message.includes("seller_access_requests") || message.includes("profiles")) {
    return "Marketplace account setup is not ready yet. Apply the project Supabase migrations, then try again.";
  }
  if (message.includes("invalid api key") || message.includes("api key is invalid")) {
    return "The sign-in service rejected this project's API key. Check the Supabase URL and publishable key in the local environment configuration.";
  }
  if (name === "TypeError" && (message.includes("failed to fetch") || message.includes("fetch failed"))) {
    return "Could not reach the sign-in service. Check your connection and the Supabase project URL, then try again.";
  }
  if (status === 502 || status === 503 || status === 504) {
    return "The sign-in service is temporarily unavailable. Check the Supabase project status and try again shortly.";
  }
  if (name === "AuthRetryableFetchError") {
    return "Supabase Auth did not return a response. Check your connection, browser Network details, and Supabase project status.";
  }
  if (status === 400) return "The sign-in request was rejected. Check the form details and try again.";
  if (status === 401) return "The sign-in service did not accept this request. Check your credentials and Supabase configuration.";

  return "Sign-in could not be completed. Please try again. If it continues, check the browser console for the development diagnostic.";
}
