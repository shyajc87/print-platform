"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useIsAdmin() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { setIsAdmin(false); return; }
      const { data } = await supabase.from("admins").select("email").eq("email", user.email).maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  return isAdmin; // null = checking, true/false = resolved
}
