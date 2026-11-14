"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { LIVROS_BIBLIA } from "@/lib/livros";
import Nav from "@/components/Nav";

const CORES = { amarelo: "Amarelo", verde: "Verde", azul: "Azul", rosa: "Rosa" };
const ORDEM = Object.fromEntries(LIVROS_BIBLIA.map((l, i) => [l.codigo, i]));

export default function Destaques() {
  const { user, loading } = useAuth();
  const [itens, setItens] = useState(null);
  const [cor, setCor] = useState("");
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "usuarios", user.uid, "destaques"), (s) =>
      setItens(s.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => ORDEM[a.codigo] - ORDEM[b.codigo] || a.c - b.c || a.v - b.v)));
  }, [user]);

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  const lista = (itens || []).filter((x) => !cor || x.cor === cor);
  const livros = [...new Set(lista.map((x) => x.livro))];

  return (
    <main><Nav /><h1>Meus destaques</h1><div className="orn">❦ ❦ ❦</div>
      <div className="filtros">
        <button className={`btn peq ${!cor ? "cheio" : ""}`} onClick={() => setCor("")}>Todos</button>
        {Object.entries(CORES).map(([k, v]) => (
          <button key={k} className={`btn peq ${cor === k ? "cheio" : ""}`} onClick={() => setCor(k)}><span className={`bolinha g-${k}`} /> {v}</button>))}
      </div>
      {itens === null ? <p>Carregando…</p> : lista.length === 0 ? (
        <div className="card"><p>Nenhum versículo grifado{cor ? " nessa cor" : ""} ainda.</p>
          <p className="peq">Durante a leitura, toque nos versículos e escolha uma cor para grifar.</p></div>
      ) : livros.map((l) => (
        <section key={l} className="card">
          <h2 style={{ marginTop: 0 }}>{l}</h2>
          {lista.filter((x) => x.livro === l).map((x) => (
            <div key={x.id} className={`destaque g-${x.cor}`}>
              <p><Link href={`/biblia/${x.codigo.toLowerCase()}/${x.c}`}><strong>{x.livro} {x.c}:{x.v}</strong></Link> — {x.texto}</p>
              <button className="btn peq" onClick={() => deleteDoc(doc(db, "usuarios", user.uid, "destaques", x.id))}>Tirar grifo</button>
            </div>))}
        </section>))}
    </main>
  );
}
