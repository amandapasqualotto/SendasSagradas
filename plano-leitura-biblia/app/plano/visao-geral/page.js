"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import plano from "@/data/plano-365-dias.json";
import { useAuth } from "@/lib/auth";
import { useProgresso } from "@/lib/progresso";
import Nav from "@/components/Nav";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const sem = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function VisaoGeral() {
  const { user, loading } = useAuth();
  const feitos = useProgresso(user);
  const [busca, setBusca] = useState("");

  const porMes = useMemo(() => {
    const b = sem(busca.trim());
    const g = {};
    for (const d of plano.dias) {
      const refs = d.capitulos.map((c) => c.referencia).join(" · ");
      if (b && !sem(refs).includes(b) && String(d.numero) !== b) continue;
      const m = d.origemCalendario?.mes || Math.ceil(d.numero / 31);
      (g[m] ||= []).push({ ...d, refs });
    }
    return g;
  }, [busca]);

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  const meses = Object.keys(porMes).map(Number);

  return (
    <main><Nav /><h1>Visão geral do plano</h1><div className="orn">❦ ❦ ❦</div>
      <div className="card">
        <p className="peq">365 dias: Antigo Testamento, Salmos/Provérbios e Novo Testamento a cada dia.</p>
        <input placeholder="Buscar um livro (ex.: Romanos) ou o número do dia" value={busca} onChange={(e) => setBusca(e.target.value)} />
        {!busca && <p className="filtros">{MESES.map((m, i) => <a key={m} className="btn peq" href={`#mes-${i + 1}`}>{m.slice(0, 3)}</a>)}</p>}
      </div>
      {meses.length === 0 && <p className="peq" style={{ textAlign: "center" }}>Nada encontrado.</p>}
      {meses.map((m) => (
        <section key={m} id={`mes-${m}`} className="card">
          <h2 style={{ marginTop: 0 }}>{MESES[m - 1]}</h2>
          <ul className="lista-dias">
            {porMes[m].map((d) => (
              <li key={d.numero} className={feitos?.has(d.numero) ? "ok" : ""}>
                <Link href={`/dia/${d.numero}`}>
                  <span className="num">{feitos?.has(d.numero) ? "✓" : d.numero}</span>
                  <span><strong>Dia {d.numero}</strong>{d.origemCalendario ? <span className="peq"> · {d.origemCalendario.dia}/{String(d.origemCalendario.mes).padStart(2, "0")}</span> : null}<br />{d.refs}</span>
                </Link>
              </li>))}
          </ul>
        </section>))}
    </main>
  );
}
