"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { LIVROS_BIBLIA, porCodigo } from "@/lib/livros";
import { idTrecho } from "@/lib/estudos";
import { CREDITO } from "@/lib/biblia.mjs";
import Leitor from "@/components/Leitor";
import Estudo from "@/components/Estudo";
import Nav from "@/components/Nav";

function vizinho(codigo, cap, passo) {
  const i = LIVROS_BIBLIA.findIndex((l) => l.codigo === codigo);
  const l = LIVROS_BIBLIA[i];
  if (passo > 0) return cap < l.caps ? [codigo, cap + 1] : LIVROS_BIBLIA[i + 1] ? [LIVROS_BIBLIA[i + 1].codigo, 1] : null;
  return cap > 1 ? [codigo, cap - 1] : LIVROS_BIBLIA[i - 1] ? [LIVROS_BIBLIA[i - 1].codigo, LIVROS_BIBLIA[i - 1].caps] : null;
}
const href = ([c, n]) => `/biblia/${c.toLowerCase()}/${n}`;
const rotulo = ([c, n]) => `${porCodigo[c].nome} ${n}`;

export default function Capitulo() {
  const p = useParams();
  const codigo = String(p.livro || "").toUpperCase();
  const cap = Number(p.cap);
  const l = porCodigo[codigo];
  const { user, loading } = useAuth();
  const [texto, setTexto] = useState(null);

  useEffect(() => {
    if (!l || !(cap >= 1 && cap <= l.caps)) return;
    setTexto(null);
    fetch(`/api/biblia?livro=${codigo}&cap=${cap}`).then((r) => r.json()).then((j) => setTexto(j.texto || false)).catch(() => setTexto(false));
  }, [codigo, cap, l]);

  useEffect(() => {
    if (user && l) setDoc(doc(db, "usuarios", user.uid), { ultimaBiblia: { codigo, cap } }, { merge: true }).catch(() => {});
  }, [user, codigo, cap, l]);

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  if (!l || !(cap >= 1 && cap <= l.caps)) return <main><Nav /><p>Capítulo não encontrado. <Link href="/biblia">Voltar</Link></p></main>;
  const ant = vizinho(codigo, cap, -1), prox = vizinho(codigo, cap, 1);

  return (
    <main><Nav />
      <h1>{l.nome} {cap}</h1><div className="orn">❦ ❦ ❦</div>
      <p className="peq" style={{ textAlign: "center" }}><Link href={`/biblia/${codigo.toLowerCase()}`}>capítulos de {l.nome}</Link></p>
      <div className="card">
        {texto === null ? <p className="peq">Carregando o texto bíblico…</p>
          : texto === false ? <p className="erro">Não foi possível carregar o texto agora. Recarregue a página.</p>
          : <Leitor versos={texto} codigo={codigo} titulo={`${l.nome}, capítulo ${cap}`} user={user} />}
        <Estudo id={idTrecho(codigo, cap, cap)} user={user} rotulo="Estudar este capítulo" />
      </div>
      <p className="peq" style={{ textAlign: "center" }}>{CREDITO}</p>
      <div className="navegar">
        {ant ? <Link className="btn" href={href(ant)}>← {rotulo(ant)}</Link> : <span />}
        {prox ? <Link className="btn" href={href(prox)}>{rotulo(prox)} →</Link> : <span />}
      </div>
    </main>
  );
}
