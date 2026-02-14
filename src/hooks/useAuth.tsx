import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  workspace_id: string | null;
  display_name: string | null;
  workspaces?: {
    status: "onboarding" | "active" | "inactive";
    onboarding_step: number;
  } | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: "admin" | "staff" | null;
  workspaceId: string | null;
  workspaceStatus: "onboarding" | "active" | "inactive" | null;
  onboardingStep: number | null;
  loading: boolean;
  signUp: (email: string, password: string, businessName: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<"admin" | "staff" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, workspaces(status, onboarding_step)")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Don't set profile to null here if we already have one? 
        // No, if fetch fails, we probably should reset or keep old? 
        // User pattern says setProfile(null).
        return;
      }

      if (!profileData) {
        console.log("No profile found for user");
        setProfile(null);
        return;
      }

      // 🔴 CRITICAL FIX: Ensure we set profile even if workspace is missing
      // The previous code returned early if !workspace_id, leaving profile null!
      setProfile(profileData);

      // User requested to force admin role
      setRole("admin");

    } catch (error) {
      console.error("Unexpected error in fetchProfile:", error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Get session
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        const session = data.session;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile if logged in
        if (session?.user) {
          await fetchProfile(session.user.id).catch((err) => {
            console.error("Profile error:", err);
          });
        }

      } catch (err) {
        console.error("Auth init failed:", err);
      } finally {
        if (mounted) {
          setLoading(false); // IMPORTANT
        }
      }
    };

    init();

    // Failsafe timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id).catch(console.error);
        } else {
          setProfile(null);
          setRole(null);
        }

        setLoading(false); // IMPORTANT
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, businessName: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { business_name: businessName, display_name: displayName },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session, user, profile, role,
        workspaceId: profile?.workspace_id ?? null,
        workspaceStatus: profile?.workspaces?.status ?? null,
        onboardingStep: profile?.workspaces?.onboarding_step ?? null,
        loading, signUp, signIn, signOut, refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
