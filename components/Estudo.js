"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Bloco de estudo gerado pela IA (estudos/{id}). Se ainda não existe, mostra o botão para gerar.
export default function Estudo({ id, user, rotulo = "Estudar este trecho", abertoInicial = false }) {
  const [est, setEst] = useState(undefined);
  const [aberto, setAberto] = useState(abertoInicial);
  const [erro, setErro] = useState("");
  const [pedindo, setPedindo] = useState(false);

  useEffect(
    () => onSnapshot(doc(db, "estudos", id), (s) => setEst(s.exists() ? s.data() : null), () => setEst(null)),
    [id]
  );

  async function gerar() {
    setErro(""); setPedindo(true); setAberto(true);
    try {
      const r = await fetch("/api/estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErro(j.erro || "Algo deu errado. Tente novamente.");
    } catch { setErro("Sem conexão. Tente novamente."); }
    setPedindo(false);
  }

  const pronto = est?.status === "pronto";
  const gerando = pedindo || est?.status === "gerando";

  return (
    <div className="bloco-estudo">
      {est === undefined ? <p className="peq">Carregando…</p>
        : pronto ? <button className="btn cheio peq" onClick={() => setAberto(!aberto)}>{aberto ? "Fechar estudo" : `📖 ${rotulo}`}</button>
        : gerando ? <p className="peq"><span className="girando">✦</span> Preparando o estudo… leva uns 20 segundos.</p>
        : <button className="btn cheio peq" onClick={gerar}>✦ {rotulo}</button>}
      {erro && <p className="erro">{erro}</p>}
      {pronto && aberto && <Conteudo e={est} />}
    </div>
  );
}

const Lista = ({ itens, chave, valor }) => (
  <ul>{itens.map((x, i) => <li key={i}><strong>{x[chave]}:</strong> {x[valor]}</li>)}</ul>
);

function Conteudo({ e }) {
  if (e.tipo === "geral") return (
    <div className="estudo">
      <p>{e.oQueEsperar}</p>
      <blockquote><strong>Mensagem do dia:</strong> {e.mensagemPrincipal}</blockquote>
      <h3>Como as leituras se conectam</h3><p>{e.ligacaoEntreLeituras}</p>
      {e.temas?.length > 0 && <p className="temas">{e.temas.map((t, i) => <span key={i}>{t}</span>)}</p>}
    </div>
  );
  if (e.tipo === "oracao") return (
    <div className="estudo">
      {e.aplicacoes?.length > 0 && <><h3>Para a vida</h3><ul>{e.aplicacoes.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
      {e.perguntasReflexao?.length > 0 && <><h3>Perguntas para reflexão</h3><ol>{e.perguntasReflexao.map((a, i) => <li key={i}>{a}</li>)}</ol></>}
      {e.oracao && <><h3>Oração</h3><p><em>{e.oracao}</em></p></>}
    </div>
  );
  return (
    <div className="estudo">
      <p>{e.resumo}</p>
      {e.mensagem && <blockquote><strong>Mensagem central:</strong> {e.mensagem}</blockquote>}
      <details><summary>Autoria e data</summary><p>{e.autoriaEData}</p></details>
      <details><summary>Contexto histórico</summary><p>{e.contextoHistorico}</p></details>
      {e.personagens?.length > 0 && <details><summary>Personagens</summary><Lista itens={e.personagens} chave="nome" valor="descricao" /></details>}
      <details><summary>Povos e culturas</summary><p>{e.povosECulturas}</p></details>
      {e.geografia?.length > 0 && <details><summary>Geografia</summary><Lista itens={e.geografia} chave="lugar" valor="descricao" /></details>}
      {e.conexoes?.length > 0 && <details><summary>Conexões com outras partes da Bíblia</summary><Lista itens={e.conexoes} chave="referencia" valor="explicacao" /></details>}
      {e.glossario?.length > 0 && <details><summary>Glossário</summary><Lista itens={e.glossario} chave="termo" valor="significado" /></details>}
      {e.versiculoChave && <p className="chave">★ <strong>{e.versiculoChave.referencia}</strong> — {e.versiculoChave.motivo}</p>}
    </div>
  );
}
