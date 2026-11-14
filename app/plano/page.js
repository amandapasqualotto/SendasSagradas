"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useProgresso, diaAtual, DIAS, TOTAL } from "@/lib/progresso";
import Nav from "@/components/Nav";

export default function Plano() {
  const { user, loading } = useAuth();
  const feitos = useProgresso(user);
  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  if (!feitos) return <main><Nav /><p>Carregando…</p></main>;
  const atual = diaAtual(feitos);
  return (
    <main><Nav /><h1>Plano de estudo</h1><div className="orn">❦ ❦ ❦</div>
      <div className="card">
        <p>Dia <strong>{atual}</strong> de {TOTAL}</p>
        <div className="barra"><div style={{ width: `${(feitos.size / TOTAL) * 100}%` }} /></div>
        <p className="peq">{feitos.size} dias concluídos</p>
        <p className="botoes">
          <Link className="btn cheio" href={`/dia/${atual}`}>Continuar no Dia {atual}</Link>
          <Link className="btn" href="/plano/visao-geral">Visão geral do plano</Link>
        </p>
      </div>
      <div className="grade">{DIAS.map((n) => (
        <Link key={n} href={`/dia/${n}`} className={`dia ${feitos.has(n) ? "ok" : ""} ${n === atual ? "atual" : ""}`}>{n}</Link>))}</div>
    </main>
  );
}
