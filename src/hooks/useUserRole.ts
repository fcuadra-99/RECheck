import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useUserRole(user: { email?: string } | null) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchRole() {
      if (!user?.email) {
        if (!mounted) return;
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error, status } = await supabase
          .from("users")
          .select("role")
          .eq("email", user.email)
          .single();

        if (!mounted) return;

        if (error) {
          console.error("useUserRole: supabase error", { error, status });
          setRole(null);
        } else {
          // Normalize role to Title Case expected by the app
          const raw = (data?.role ?? null) as string | null;
          if (!raw) {
            setRole(null);
          } else {
            const r = raw.trim().toLowerCase();
            const mapped = r === 'staff' ? 'Staff' : r === 'reviewer' ? 'Reviewer' : r === 'researcher' ? 'Researcher' : null;
            setRole(mapped);
          }
        }
      } catch (err) {
        console.error("useUserRole: unexpected error", err);
        if (mounted) setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRole();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { role, loading };
}
