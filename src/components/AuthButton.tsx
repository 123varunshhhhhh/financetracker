import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>Signed in as {user.email}</span>
        <Button onClick={handleLogout}>Sign Out</Button>
      </div>
    );
  }

  return <Button onClick={handleLogin}>Sign in with Google</Button>;
} 