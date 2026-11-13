"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Mostra o estudo aprofundado do dia (relatorios/{n}). Se ainda não existir,
// oferece o botão que pede ao servidor para gerá-lo com o Gemini.
export default function Relatorio({ n, user }) {
  const [rel, setRel] = useState(undefined); // undefined = carregando, null = não existe
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [pedindo, setPedindo] = useState(false);

  useEffect(
    () => onSnapshot(doc(db, "relatorios", String(n)), (s) => setRel(s.exists() ? s.data() : null), () => setRel(null)),
    [n]
  );

  async function gerar() {
    setErro(""); setPedindo(true); setAberto(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch("/api/relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dia: n }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErro(j.erro || "Algo deu errado. Tente novamente.");
    } catch { setErro("Sem conexão. Tente novamente."); }
    setPedindo(false);
  }

  const pronto = rel?.status === "pronto";
  const gerando = pedindo || rel?.status === "gerando";

  return (
    <div className="card">
      <h2>Estudo aprofundado do dia</h2>
      <p className="peq">Contexto histórico, autores, povos, geografia, conexões bíblicas e mensagem principal.</p>
      {rel === undefined ? <p className="peq">Carregando…</p>
        : pronto ? <button className="btn cheio" onClick={() => setAberto(!aberto)}>{aberto ? "Fechar estudo" : "Abrir estudo"}</button>
        : gerando ? <p><span className="girando">✦</span> Preparando o estudo… isso leva cerca de 30 segundos.</p>
        : <button className="btn cheio" onClick={gerar}>Gerar estudo do dia</button>}
      {erro && <p className="erro">{erro}</p>}
      {pronto && aberto && <Conteudo r={rel} />}
    </div>
  );
}

function Conteudo({ r }) {
  return (
    <div className="estudo">
      <h3>Visão geral</h3><p>{r.visaoGeral}</p>
      <blockquote><strong>Mensagem principal:</strong> {r.mensagemPrincipal}</blockquote>
      <h3>Como as leituras se conectam</h3><p>{r.ligacaoEntreLeituras}</p>

      {r.passagens?.map((p, i) => (
        <section key={i} className="passagem">
          <h3>{p.referencia}</h3>
          <p>{p.resumo}</p>
          <details><summary>Autoria e data</summary><p>{p.autoriaEData}</p></details>
          <details><summary>Contexto histórico</summary><p>{p.contextoHistorico}</p></details>
          {p.personagens?.length > 0 && <details><summary>Personagens</summary>
            <ul>{p.personagens.map((x, j) => <li key={j}><strong>{x.nome}:</strong> {x.descricao}</li>)}</ul></details>}
          <details><summary>Povos e culturas</summary><p>{p.povosECulturas}</p></details>
          {p.geografia?.length > 0 && <details><summary>Geografia</summary>
            <ul>{p.geografia.map((x, j) => <li key={j}><strong>{x.lugar}:</strong> {x.descricao}</li>)}</ul></details>}
          {p.conexoes?.length > 0 && <details><summary>Conexões com outras partes da Bíblia</summary>
            <ul>{p.conexoes.map((x, j) => <li key={j}><strong>{x.referencia}:</strong> {x.explicacao}</li>)}</ul></details>}
          {p.versiculoChave && <p className="chave">★ <strong>{p.versiculoChave.referencia}</strong> — {p.versiculoChave.motivo}</p>}
        </section>
      ))}

      {r.glossario?.length > 0 && <><h3>Glossário</h3>
        <ul>{r.glossario.map((g, i) => <li key={i}><strong>{g.termo}:</strong> {g.significado}</li>)}</ul></>}
      {r.aplicacoes?.length > 0 && <><h3>Para a vida</h3><ul>{r.aplicacoes.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
      {r.perguntasReflexao?.length > 0 && <><h3>Perguntas para reflexão</h3><ol>{r.perguntasReflexao.map((a, i) => <li key={i}>{a}</li>)}</ol></>}
      {r.oracao && <><h3>Oração</h3><p><em>{r.oracao}</em></p></>}
    </div>
  );
}
