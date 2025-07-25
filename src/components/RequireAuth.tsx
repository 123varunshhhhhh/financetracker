import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="text-center py-12 text-lg">Loading...</div>;
  if (!user) return <div className="text-center py-12 text-lg">Please sign in to access this section.</div>;

  return <>{children}</>;
} 