import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function userAvatar(user: User | null) {
  const m = (user?.user_metadata ?? {}) as {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
  };
  return {
    email: user?.email ?? "",
    name: m.full_name || m.name || user?.email?.split("@")[0] || "",
    picture: m.avatar_url || m.picture || "",
  };
}
