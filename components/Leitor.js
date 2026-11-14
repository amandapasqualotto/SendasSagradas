"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { porCodigo } from "@/lib/livros";

const CORES = ["amarelo", "verde", "azul", "rosa"];
const PALAVRA = /^[\p{L}'-]{2,30}$/u;

// Texto bíblico com: grifos (toque nos versículos), significado de palavra (selecione uma palavra) e áudio.
export default function Leitor({ versos, codigo, titulo, user }) {
  const router = useRouter();
  const nomeLivro = porCodigo[codigo]?.nome || titulo;
  const [grifos, setGrifos] = useState({});
  const [sel, setSel] = useState([]);
  const [lendo, setLendo] = useState(null);
  const [palavra, setPalavra] = useState(null);
  const [signif, setSignif] = useState(null);
  const [aviso, setAviso] = useState("");
  const varios = new Set(versos.map((v) => v.c)).size > 1;
  const chave = (v) => `${v.c}_${v.v}`;

  useEffect(() => {
    if (!user || !codigo) return;
    const q = query(collection(db, "usuarios", user.uid, "destaques"), where("codigo", "==", codigo));
    return onSnapshot(q, (s) => {
      const m = {};
      s.forEach((d) => { const x = d.data(); m[`${x.c}_${x.v}`] = x.cor; });
      setGrifos(m);
    });
  }, [user, codigo]);

  // Detecta uma palavra selecionada (duplo clique no computador / toque longo no celular)
  const limpar = useRef();
  useEffect(() => {
    function aoSelecionar() {
      const s = window.getSelection();
      const txt = s?.toString().trim().replace(/[.,;:!?“”"()]+$/g, "").replace(/^[“"(]+/, "");
      const el = s?.anchorNode?.parentElement?.closest?.("[data-k]");
      clearTimeout(limpar.current);
      if (txt && PALAVRA.test(txt) && el) {
        setPalavra({ txt, k: el.dataset.k });
        setSel([]); // o duplo clique também marca o versículo: desfaz para mostrar o botão de significado
      } else if (!txt) {
        // espera um pouco: no celular, tocar no botão pode apagar a seleção antes do clique
        limpar.current = setTimeout(() => setPalavra(null), 600);
      }
    }
    document.addEventListener("selectionchange", aoSelecionar);
    return () => { document.removeEventListener("selectionchange", aoSelecionar); clearTimeout(limpar.current); };
  }, []);

  function tocar(v, e) {
    if (e?.detail > 1) return; // segundo clique de um duplo clique
    if (window.getSelection()?.toString().trim()) return; // está selecionando texto
    const k = chave(v);
    setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  }

  const selecionados = versos.filter((v) => sel.includes(chave(v)));
  function refSel() {
    const caps = [...new Set(selecionados.map((v) => v.c))];
    if (caps.length > 1) return `${nomeLivro} ${caps[0]}–${caps[caps.length - 1]}`;
    const vs = selecionados.map((v) => v.v);
    const a = Math.min(...vs), b = Math.max(...vs);
    return `${nomeLivro} ${caps[0]}:${a}${b > a ? `-${b}` : ""}`;
  }
  const textoSel = () => selecionados.map((v) => v.t).join(" ");

  async function grifar(cor) {
    await Promise.all(selecionados.map((v) => {
      const ref = doc(db, "usuarios", user.uid, "destaques", `${codigo}_${v.c}_${v.v}`);
      return cor
        ? setDoc(ref, { codigo, livro: nomeLivro, c: v.c, v: v.v, texto: v.t, cor, criadoEm: serverTimestamp() })
        : deleteDoc(ref);
    }));
    setSel([]);
  }
  async function copiar() {
    await navigator.clipboard.writeText(`"${textoSel()}" (${refSel()})`).catch(() => {});
    setAviso("Copiado ✓"); setTimeout(() => setAviso(""), 1500); setSel([]);
  }
  function mural() {
    router.push(`/mural?ref=${encodeURIComponent(refSel())}&texto=${encodeURIComponent(textoSel().slice(0, 1000))}`);
  }

  async function significado() {
    const [c, v] = palavra.k.split("_").map(Number);
    const verso = versos.find((x) => x.c === c && x.v === v);
    setSignif({ carregando: true, palavra: palavra.txt });
    window.getSelection()?.removeAllRanges();
    setPalavra(null);
    try {
      const r = await fetch("/api/significado", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ palavra: palavra.txt, codigo, c, v, texto: verso?.t }),
      });
      const j = await r.json();
      setSignif(r.ok ? j : { erro: j.erro || "Não foi possível buscar agora." });
    } catch { setSignif({ erro: "Sem conexão." }); }
  }

  return (
    <div className="leitor">
      <Ouvir versos={versos} titulo={titulo} aoVerso={setLendo} inicio={sel.length ? versos.findIndex((v) => sel.includes(chave(v))) : 0} />
      <div className="biblia">
        {versos.map((v, i) => {
          const k = chave(v);
          return (
            <span key={k}>
              {varios && (i === 0 || versos[i - 1].c !== v.c) && <span className="capitulo">Capítulo {v.c}</span>}
              <span data-k={k} onClick={(e) => tocar(v, e)}
                className={`verso${sel.includes(k) ? " sel" : ""}${grifos[k] ? ` g-${grifos[k]}` : ""}${lendo === k ? " lendo" : ""}`}>
                <sup>{v.v}</sup>{v.t}
              </span>{" "}
            </span>
          );
        })}
      </div>
      <p className="peq dica">Toque nos versículos para grifar ou compartilhar. Selecione uma palavra para ver o significado.</p>

      {palavra && !sel.length && (
        <div className="flutuante"><button className="btn cheio" onMouseDown={(e) => e.preventDefault()} onClick={significado}>📖 Significado de “{palavra.txt}”</button></div>
      )}

      {sel.length > 0 && (
        <div className="barra-sel">
          <span className="peq">{refSel()}</span>
          <div className="cores">
            {CORES.map((c) => <button key={c} className={`cor g-${c}`} aria-label={`Grifar de ${c}`} onClick={() => grifar(c)} />)}
            <button className="btn peq" onClick={() => grifar(null)}>Tirar grifo</button>
          </div>
          <div className="acoes">
            <button className="btn peq" onClick={copiar}>Copiar</button>
            <button className="btn peq" onClick={mural}>Compartilhar no mural</button>
            <button className="btn peq" onClick={() => setSel([])}>✕</button>
          </div>
        </div>
      )}
      {aviso && <div className="flutuante"><span className="btn cheio">{aviso}</span></div>}

      {signif && (
        <div className="modal" onClick={() => setSignif(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>“{signif.palavra}”</h3>
            {signif.carregando ? <p><span className="girando">✦</span> Buscando o significado…</p>
              : signif.erro ? <p className="erro">{signif.erro}</p>
              : <>
                  <p>{signif.significado}</p>
                  <p><strong>Em {signif.referencia}:</strong> {signif.noContexto}</p>
                  {signif.original && <p className="peq"><strong>No original:</strong> {signif.original}</p>}
                </>}
            <button className="btn peq" onClick={() => setSignif(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Leitura em voz alta com a voz do próprio navegador (grátis). Lê versículo por versículo.
function Ouvir({ versos, titulo, aoVerso, inicio }) {
  const [ok, setOk] = useState(false);
  const [estado, setEstado] = useState("parado");
  const [vel, setVel] = useState(1);
  const ativo = useRef(false);
  const velRef = useRef(1);

  useEffect(() => {
    setOk(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => { ativo.current = false; window.speechSynthesis?.cancel(); };
  }, []);
  useEffect(() => { velRef.current = vel; }, [vel]);
  useEffect(() => () => { ativo.current = false; window.speechSynthesis?.cancel(); }, [versos]);

  function voz() {
    const vs = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("pt"));
    return vs.find((v) => /pt-br/i.test(v.lang) && /google|natural|francisca|thalita|luciana/i.test(v.name))
      || vs.find((v) => /pt-br/i.test(v.lang)) || vs[0];
  }
  function falar(i) {
    if (!ativo.current) return;
    if (i >= versos.length) return parar();
    const v = versos[i];
    const u = new SpeechSynthesisUtterance(i === inicio && i === 0 ? `${titulo}. ${v.t}` : v.t);
    u.lang = "pt-BR"; u.rate = velRef.current;
    const vz = voz(); if (vz) u.voice = vz;
    u.onstart = () => aoVerso(`${v.c}_${v.v}`);
    u.onend = () => falar(i + 1);
    window.speechSynthesis.speak(u);
  }
  function tocar() {
    if (estado === "pausado") { window.speechSynthesis.resume(); setEstado("tocando"); return; }
    window.speechSynthesis.cancel();
    ativo.current = true; setEstado("tocando");
    falar(Math.max(0, inicio));
  }
  function pausar() { window.speechSynthesis.pause(); setEstado("pausado"); }
  function parar() { ativo.current = false; window.speechSynthesis.cancel(); setEstado("parado"); aoVerso(null); }

  if (!ok) return null;
  return (
    <div className="ouvir">
      {estado !== "tocando"
        ? <button className="btn peq" onClick={tocar}>▶ {estado === "pausado" ? "Continuar" : inicio > 0 ? "Ouvir a partir daqui" : "Ouvir"}</button>
        : <button className="btn peq" onClick={pausar}>⏸ Pausar</button>}
      {estado !== "parado" && <button className="btn peq" onClick={parar}>⏹ Parar</button>}
      <select value={vel} onChange={(e) => setVel(Number(e.target.value))} aria-label="Velocidade">
        {[0.8, 1, 1.2, 1.5].map((x) => <option key={x} value={x}>{x}×</option>)}
      </select>
    </div>
  );
}
