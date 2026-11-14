"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { porCodigo } from "@/lib/livros";
import Nav from "@/components/Nav";

export default function Livro() {
  const codigo = String(useParams().livro || "").toUpperCase();
  const l = porCodigo[codigo];
  if (!l) return <main><Nav /><p>Livro não encontrado. <Link href="/biblia">Voltar</Link></p></main>;
  return (
    <main><Nav /><h1>{l.nome}</h1><div className="orn">❦ ❦ ❦</div>
      <div className="card">
        <p className="peq">{l.caps} capítulo{l.caps > 1 ? "s" : ""} · <Link href="/biblia">todos os livros</Link></p>
        <div className="grade">
          {Array.from({ length: l.caps }, (_, i) => i + 1).map((c) => (
            <Link key={c} href={`/biblia/${codigo.toLowerCase()}/${c}`} className="dia">{c}</Link>))}
        </div>
      </div>
    </main>
  );
}
