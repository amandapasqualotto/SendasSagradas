"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { CREDITO } from "@/lib/biblia.mjs";
import { codigoDoPlano, porCodigo } from "@/lib/livros";
import { idDia, idTrecho } from "@/lib/estudos";
import { TOTAL } from "@/lib/progresso";
import Leitor from "@/components/Leitor";
import Estudo from "@/components/Estudo";
import Nav from "@/components/Nav";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// Converte um item do plano em código do livro + capítulos
function trecho(c) {
  const codigo = codigoDoPlano(c.livro);
  const c1 = c.livroInteiro ? 1 : c.capInicio;
  const c2 = c.livroInteiro ? porCodigo[codigo]?.caps || 1 : c.capFim;
  return { codigo, c1, c2, vers: c.versiculos || null };
}

function Secao({ titulo, sub, aberta, children }) {
  return (
    <details className="secao-dia card" open={aberta}>
      <summary><span className="titulo-secao">{titulo}</span>{sub && <span className="peq"> {sub}</span>}</summary>
      <div className="corpo-secao">{children}</div>
    </details>
  );
}

export default function Dia() {
  const n = Number(useParams().n); const { user, loading } = useAuth();
  const [dia, setDia] = useState(null); const [nota, setNota] = useState(""); const [feito, setFeito] = useState(false);
  const [erroTexto, setErroTexto] = useState(false);
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
        } catch { setErroTexto(true); }
      }
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
    // usado pelos lembretes: qual o próximo dia e quando foi a última leitura
    await setDoc(doc(db, "usuarios", user.uid), { diaAtual: Math.min(n + 1, TOTAL), ultimaLeitura: serverTimestamp() }, { merge: true });
    setFeito(true);
  }

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  if (dia === null) return <main><Nav /><p>Carregando…</p></main>;
  if (dia === false) return <main><Nav /><p>Dia não encontrado. <Link href="/plano">Voltar</Link></p></main>;
  const data = dia.origemCalendario ? `${dia.origemCalendario.dia} de ${MESES[dia.origemCalendario.mes - 1]}` : "";

  return (
    <main><Nav />
      <h1>Dia {n}</h1>
      {data && <p className="peq" style={{ textAlign: "center", margin: 0 }}>{data}</p>}
      <div className="orn">❦ ❦ ❦</div>

      <Secao titulo="Visão geral do dia" sub={dia.capitulos.map((c) => c.referencia).join(" · ")} aberta>
        <Estudo id={idDia(n, "geral")} user={user} rotulo="Ver visão geral" abertoInicial />
      </Secao>

      {dia.capitulos.map((c, i) => {
        const t = trecho(c);
        return (
          <Secao key={i} titulo={c.referencia} sub={["Antigo Testamento", "Salmos e Provérbios", "Novo Testamento"][i] || ""}>
            {c.texto?.length ? <Leitor versos={c.texto} codigo={t.codigo} titulo={c.referencia} user={user} />
              : <p className="peq">{erroTexto ? "Não foi possível carregar o texto agora. Recarregue a página." : "Carregando o texto bíblico…"}</p>}
            {t.codigo && <Estudo id={idTrecho(t.codigo, t.c1, t.c2, t.vers)} user={user} rotulo={`Estudar ${c.referencia}`} />}
          </Secao>
        );
      })}

      <Secao titulo="Oração e reflexões">
        <Estudo id={idDia(n, "oracao")} user={user} rotulo="Abrir oração e reflexões" abertoInicial />
      </Secao>

      <Secao titulo="Minhas anotações" aberta={!!nota}>
        <textarea rows={6} value={nota} onChange={(e) => salvar(e.target.value)} placeholder="Escreva aqui o que Deus falou com você hoje…" />
      </Secao>

      <p className="peq" style={{ textAlign: "center" }}>{CREDITO}</p>
      <div style={{ textAlign: "center" }}>
        {!feito ? <button className="btn cheio" onClick={concluir}>Concluir dia</button> : (
          <div className="card"><p>✓ Dia {n} concluído.</p>
            {n < TOTAL && <p><Link className="btn cheio" href={`/dia/${n + 1}`}>Ir para o Dia {n + 1}</Link></p>}
            <p className="peq"><Link href="/conta#lembretes">Configurar lembrete diário</Link></p></div>)}
      </div>
      <div className="navegar">
        {n > 1 ? <Link className="btn" href={`/dia/${n - 1}`}>← Dia {n - 1}</Link> : <span />}
        <Link className="btn" href="/plano/visao-geral">Visão geral</Link>
        {n < TOTAL ? <Link className="btn" href={`/dia/${n + 1}`}>Dia {n + 1} →</Link> : <span />}
      </div>
    </main>
  );
}
