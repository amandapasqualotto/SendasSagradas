"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import Relatorio from "@/components/Relatorio";
import Nav from "@/components/Nav";
import { CREDITO } from "@/lib/biblia.mjs";

const SECOES = [["contexto", "Contexto histórico, social e geográfico"], ["conexoes", "Conexões com outras passagens"], ["explicacao", "Explicação detalhada"]];
const TOTAL = 365;

function TextoBiblico({ texto }) {
  const varios = new Set(texto.map((v) => v.c)).size > 1;
  return (
    <div className="biblia">
      {texto.map((v, i) => (
        <span key={i}>
          {varios && (i === 0 || texto[i - 1].c !== v.c) && <span className="capitulo">Capítulo {v.c}</span>}
          <sup>{v.v}</sup>{v.t}{" "}
        </span>
      ))}
    </div>
  );
}

export default function Dia() {
  const n = Number(useParams().n); const { user, loading } = useAuth();
  const [dia, setDia] = useState(null); const [nota, setNota] = useState(""); const [feito, setFeito] = useState(false);
  const [credito, setCredito] = useState(""); const [erroTexto, setErroTexto] = useState(false);
  const timer = useRef();
  const refProg = user && doc(db, "usuarios", user.uid, "progresso", String(n));

  useEffect(() => {
    if (!user) return;
    setDia(null); setNota(""); setFeito(false); setErroTexto(false);
    getDoc(doc(db, "dias", String(n))).then(async (s) => {
      if (!s.exists()) return setDia(false);
      const d = s.data();
      setDia(d);
      // Plano B: se o texto ainda não foi importado para o Firestore, busca na internet
      if (d.capitulos?.some((c) => !c.texto?.length)) {
        try {
          const r = await fetch(`/api/biblia?dia=${n}`);
          if (!r.ok) throw new Error();
          const j = await r.json();
          setDia({ ...d, capitulos: d.capitulos.map((c, i) => ({ ...c, texto: c.texto?.length ? c.texto : j.capitulos[i]?.texto })) });
          setCredito(CREDITO);
        } catch { setErroTexto(true); }
      } else setCredito(CREDITO);
    });
    getDoc(doc(db, "usuarios", user.uid, "progresso", String(n))).then((s) => {
      if (s.exists()) { setNota(s.data().anotacoes || ""); setFeito(!!s.data().concluido); }
    });
  }, [user, n]);

  function salvar(v) {
    setNota(v); clearTimeout(timer.current);
    timer.current = setTimeout(() => setDoc(refProg, { anotacoes: v }, { merge: true }), 800);
  }
  async function concluir() {
    await setDoc(refProg, { concluido: true, concluidoEm: serverTimestamp() }, { merge: true });
    // usado pelos lembretes do n8n: qual o próximo dia e quando foi a última leitura
    await setDoc(doc(db, "usuarios", user.uid), { diaAtual: Math.min(n + 1, TOTAL), ultimaLeitura: serverTimestamp() }, { merge: true });
    setFeito(true);
  }

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  if (dia === null) return <main><p>Carregando…</p></main>;
  if (dia === false) return <main><p>Dia não encontrado. <Link href="/">Voltar</Link></p></main>;
  const intro = dia.introducao;
  return (
    <main><Nav /><h1>Dia {n}</h1><div className="orn">❦ ❦ ❦</div>
      {intro ? (
        <div className="card"><h2>Introdução</h2><p>{intro.oQueEsperar}</p>
          {intro.licoes?.length > 0 && <ul>{intro.licoes.map((l, i) => <li key={i}>{l}</li>)}</ul>}
          <p>{intro.resumo}</p>{intro.oracao && <><h3>Oração guiada</h3><p><em>{intro.oracao}</em></p></>}</div>
      ) : null}

      {dia.capitulos?.map((c, i) => (
        <div className="card" key={i}><h2>{c.referencia}</h2>
          {c.texto?.length ? <TextoBiblico texto={c.texto} />
            : c.textoBiblico ? <p className="biblia">{c.textoBiblico}</p>
            : <p className="peq">{erroTexto ? "Não foi possível carregar o texto agora. Recarregue a página." : "Carregando o texto bíblico…"}</p>}
          {SECOES.map(([k, t]) => c[k] && <details key={k}><summary>{t}</summary><p>{c[k]}</p></details>)}
          {c.termos?.length > 0 && <details><summary>Termos-chave</summary><ul>{c.termos.map((t, j) => <li key={j}>{t}</li>)}</ul></details>}
          <p style={{ textAlign: "right", margin: "10px 0 0" }}>
            <Link className="btn peq" href={`/mural?dia=${n}&ref=${encodeURIComponent(c.referencia)}`}>Compartilhar no mural</Link></p>
        </div>))}
      {credito && <p className="peq" style={{ textAlign: "center" }}>{credito}</p>}

      <Relatorio n={n} user={user} />

      <div className="card"><h2>Minhas anotações</h2>
        <textarea rows={6} value={nota} onChange={(e) => salvar(e.target.value)} placeholder="Escreva aqui o que Deus falou com você hoje…" /></div>
      <div style={{ textAlign: "center" }}>
        {!feito ? <button className="btn cheio" onClick={concluir}>Concluir dia</button> : (
          <div className="card"><p>✓ Dia {n} concluído.</p>
            {n < TOTAL && <p><Link className="btn cheio" href={`/dia/${n + 1}`}>Ir para o Dia {n + 1}</Link></p>}
            <p className="peq"><Link href="/#lembretes">Configurar lembrete diário</Link></p></div>)}
      </div></main>
  );
}
