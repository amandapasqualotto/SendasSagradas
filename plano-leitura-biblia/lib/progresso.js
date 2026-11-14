"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const TOTAL = 365;
export const DIAS = Array.from({ length: TOTAL }, (_, i) => i + 1);
export const diaAtual = (feitos) => DIAS.find((n) => !feitos.has(n)) ?? TOTAL;

// Conjunto com os números dos dias concluídos pelo usuário
export function useProgresso(user) {
  const [feitos, setFeitos] = useState(null);
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "usuarios", user.uid, "progresso")).then((s) =>
      setFeitos(new Set(s.docs.filter((d) => d.data().concluido).map((d) => Number(d.id)))));
  }, [user]);
  return feitos;
}
