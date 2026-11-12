"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
const Ctx = createContext({ user: null, loading: true });
export function AuthProvider({ children }) {
  const [s, setS] = useState({ user: null, loading: true });
  useEffect(() => onAuthStateChanged(auth, (user) => setS({ user, loading: false })), []);
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
