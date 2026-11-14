"use client";
import { useEffect, useState } from "react";

// Botão que alterna o tema: automático (segue o aparelho) → claro → escuro
const ORDEM = ["auto", "claro", "escuro"];
const ROTULO = { auto: "🌓 Automático", claro: "☀️ Claro", escuro: "🌙 Escuro" };

export function aplicarTema(t) {
  try { t === "auto" ? localStorage.removeItem("tema") : localStorage.setItem("tema", t); } catch {}
  if (t === "auto") delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = t;
}

export default function Tema({ completo = false }) {
  const [tema, setTema] = useState(null);
  useEffect(() => { try { setTema(localStorage.getItem("tema") || "auto"); } catch { setTema("auto"); } }, []);
  if (!tema) return null;
  if (completo) return (
    <div className="botoes">
      {ORDEM.map((t) => (
        <button key={t} className={`btn peq ${tema === t ? "cheio" : ""}`} onClick={() => { aplicarTema(t); setTema(t); }}>{ROTULO[t]}</button>))}
    </div>
  );
  const prox = ORDEM[(ORDEM.indexOf(tema) + 1) % 3];
  return (
    <button className="tema" title={`Tema: ${ROTULO[tema]} (toque para mudar)`} aria-label="Mudar tema"
      onClick={() => { aplicarTema(prox); setTema(prox); }}>{ROTULO[tema].split(" ")[0]}</button>
  );
}
