"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

const SECOES = [["contexto", "Contexto histórico, social e geográfico"], ["conexoes", "Conexões com outras passagens"], ["explicacao", "Explicação detalhada"]];

export default function Dia() {
  const n = Number(useParams().n); const { user, loading } = useAuth();
  const [dia, setDia] = useState(null); const [nota, setNota] = useState(""); const [feito, setFeito] = useState(false);
  const [alerta, setAlerta] = useState(false); const timer = useRef();
  const refProg = user && doc(db, "usuarios", user.uid, "progresso", String(n));
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "dias", String(n))).then((s) => setDia(s.exists() ? s.data() : false));
    getDoc(doc(db, "usuarios", user.uid, "progresso", String(n))).then((s) => {
      if (s.exists()) { setNota(s.data().anotacoes || ""); setFeito(!!s.data().concluido); }
    });
  }, [user, n]);
  function salvar(v) {
    setNota(v); clearTimeout(timer.current);
    timer.current = setTimeout(() => setDoc(refProg, { anotacoes: v }, { merge: true }), 800);
  }
  async function concluir() { await setDoc(refProg, { concluido: true, concluidoEm: serverTimestamp() }, { merge: true }); setFeito(true); }
  async function mudaAlerta(v) { setAlerta(v); await setDoc(doc(db, "usuarios", user.uid), { notificacoesAtivas: v }, { merge: true }); }

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  if (dia === null) return <main><p>Carregando…</p></main>;
  if (dia === false) return <main><p>Dia não encontrado. <Link href="/">Voltar</Link></p></main>;
  const intro = dia.introducao;
  return (
    <main><p><Link href="/">← Início</Link></p><h1>Dia {n}</h1><div className="orn">❦ ❦ ❦</div>
      {intro ? (
        <div className="card"><h2>Introdução</h2><p>{intro.oQueEsperar}</p>
          {intro.licoes?.length > 0 && <ul>{intro.licoes.map((l, i) => <li key={i}>{l}</li>)}</ul>}
          <p>{intro.resumo}</p>{intro.oracao && <><h3>Oração guiada</h3><p><em>{intro.oracao}</em></p></>}</div>
      ) : <p className="peq" style={{ textAlign: "center" }}>Conteúdo introdutório deste dia em preparação.</p>}
      {dia.capitulos?.map((c, i) => (
        <div className="card" key={i}><h2>{c.referencia}</h2>
          {c.textoBiblico ? <p className="biblia">{c.textoBiblico}</p> : <p className="peq">Texto bíblico em preparação.</p>}
          {SECOES.map(([k, t]) => c[k] && <details key={k}><summary>{t}</summary><p>{c[k]}</p></details>)}
          {c.termos?.length > 0 && <details><summary>Termos-chave</summary><ul>{c.termos.map((t, j) => <li key={j}>{t}</li>)}</ul></details>}
        </div>))}
      <div className="card"><h2>Minhas anotações</h2>
        <textarea rows={6} value={nota} onChange={(e) => salvar(e.target.value)} placeholder="Escreva aqui o que Deus falou com você hoje…" /></div>
      <div style={{ textAlign: "center" }}>
        {!feito ? <button className="btn cheio" onClick={concluir}>Concluir dia</button> : (
          <div className="card"><p>✓ Dia {n} concluído.</p>
            <label><input type="checkbox" style={{ width: "auto" }} checked={alerta} onChange={(e) => mudaAlerta(e.target.checked)} /> Quero receber um alerta para o Dia {n + 1}</label>
            <p><Link className="btn cheio" href={`/dia/${n + 1}`}>Ir para o Dia {n + 1}</Link></p></div>)}
      </div></main>
  );
}
