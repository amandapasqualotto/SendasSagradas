"use client";
import Link from "next/link";
import { LIVROS_BIBLIA } from "@/lib/livros";
import Nav from "@/components/Nav";

export default function Biblia() {
  const grupo = (t) => LIVROS_BIBLIA.filter((l) => l.t === t);
  return (
    <main><Nav /><h1>Bíblia</h1><div className="orn">❦ ❦ ❦</div>
      {[["at", "AT", "Antigo Testamento"], ["nt", "NT", "Novo Testamento"]].map(([id, t, titulo]) => (
        <section key={id} id={id} className="card">
          <h2 style={{ marginTop: 0 }}>{titulo}</h2>
          <div className="livros">
            {grupo(t).map((l) => <Link key={l.codigo} href={`/biblia/${l.codigo.toLowerCase()}`} className="livro">{l.nome}</Link>)}
          </div>
        </section>))}
    </main>
  );
}
