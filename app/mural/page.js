"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, limit,
  onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import Nav from "@/components/Nav";

const TIPOS = { versiculo: "Versículo", palavra: "Palavra", oracao: "Pedido de oração", testemunho: "Testemunho" };

function quando(ts) {
  if (!ts?.toDate) return "agora";
  const d = ts.toDate(); const min = Math.round((Date.now() - d) / 60000);
  if (min < 1) return "agora"; if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.round(min / 60)} h`;
  return d.toLocaleDateString("pt-BR");
}

export default function Mural() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState([]); const [filtro, setFiltro] = useState("");
  const [nome, setNome] = useState(""); const [admin, setAdmin] = useState(false);
  const [f, setF] = useState({ tipo: "versiculo", referencia: "", texto: "", dia: null });
  const [enviando, setEnviando] = useState(false); const [erro, setErro] = useState("");

  useEffect(() => {
    // Pré-preenche quando vem do botão "Compartilhar no mural" de um dia
    const q = new URLSearchParams(window.location.search);
    if (q.get("ref")) setF((x) => ({ ...x, referencia: q.get("ref"), dia: Number(q.get("dia")) || null, texto: q.get("texto") || x.texto }));
  }, []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "usuarios", user.uid)).then((s) => setNome(s.exists() ? s.data().nome || "" : ""));
    getDoc(doc(db, "admins", user.uid)).then((s) => setAdmin(s.exists())).catch(() => {});
    const q = query(collection(db, "mural"), orderBy("criadoEm", "desc"), limit(100));
    return onSnapshot(q, (s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [user]);

  async function publicar(e) {
    e.preventDefault(); setErro("");
    const texto = f.texto.trim(); const n = nome.trim();
    if (!n) return setErro("Diga como você quer aparecer no mural.");
    if (!texto) return setErro("Escreva algo para compartilhar.");
    setEnviando(true);
    try {
      await setDoc(doc(db, "usuarios", user.uid), { nome: n }, { merge: true });
      await addDoc(collection(db, "mural"), {
        uid: user.uid, nome: n.slice(0, 60), tipo: f.tipo, texto: texto.slice(0, 1000),
        referencia: f.referencia.trim().slice(0, 100), dia: f.dia, amens: [], criadoEm: serverTimestamp(),
      });
      setF({ tipo: "versiculo", referencia: "", texto: "", dia: null });
      window.history.replaceState(null, "", "/mural");
    } catch { setErro("Não foi possível publicar. Tente de novo."); }
    setEnviando(false);
  }

  function amem(p) {
    const ja = p.amens?.includes(user.uid);
    updateDoc(doc(db, "mural", p.id), { amens: ja ? arrayRemove(user.uid) : arrayUnion(user.uid) });
  }
  function apagar(p) {
    if (window.confirm("Apagar esta publicação?")) deleteDoc(doc(db, "mural", p.id));
  }

  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para ver o mural</Link></p></main>;
  const lista = filtro ? posts.filter((p) => p.tipo === filtro) : posts;

  return (
    <main><Nav /><h1>Mural da comunidade</h1><div className="orn">❦ ❦ ❦</div>
      <form className="card" onSubmit={publicar}>
        <h2>Compartilhar</h2>
        {!nome && <input placeholder="Seu nome (como vai aparecer)" maxLength={60} onBlur={(e) => setNome(e.target.value)} />}
        <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
          {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="Referência (opcional), ex.: Salmo 23:1" maxLength={100}
          value={f.referencia} onChange={(e) => setF({ ...f, referencia: e.target.value })} />
        <textarea rows={4} maxLength={1000} placeholder="Escreva o versículo, uma palavra, um pedido de oração…"
          value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} />
        <p className="peq" style={{ textAlign: "right", margin: 0 }}>{f.texto.length}/1000</p>
        {erro && <p className="erro">{erro}</p>}
        <button className="btn cheio" disabled={enviando}>{enviando ? "Publicando…" : "Publicar"}</button>
      </form>

      <div className="filtros">
        <button className={`btn peq ${!filtro ? "cheio" : ""}`} onClick={() => setFiltro("")}>Tudo</button>
        {Object.entries(TIPOS).map(([k, v]) => (
          <button key={k} className={`btn peq ${filtro === k ? "cheio" : ""}`} onClick={() => setFiltro(k)}>{v}</button>))}
      </div>

      {lista.length === 0 && <p className="peq" style={{ textAlign: "center" }}>Nada por aqui ainda. Seja a primeira pessoa a compartilhar!</p>}
      {lista.map((p) => (
        <div className="card post" key={p.id}>
          <p className="peq"><strong>{p.nome}</strong> · {TIPOS[p.tipo] || p.tipo} · {quando(p.criadoEm)}
            {p.dia ? <> · <Link href={`/dia/${p.dia}`}>Dia {p.dia}</Link></> : null}</p>
          {p.referencia && <h3 style={{ margin: ".2em 0" }}>{p.referencia}</h3>}
          <p style={{ whiteSpace: "pre-wrap" }}>{p.texto}</p>
          <div className="acoes">
            <button className={`btn peq ${p.amens?.includes(user.uid) ? "cheio" : ""}`} onClick={() => amem(p)}>
              🙏 {p.tipo === "oracao" ? "Estou orando" : "Amém"} {p.amens?.length ? `· ${p.amens.length}` : ""}</button>
            {(p.uid === user.uid || admin) && <button className="btn peq" onClick={() => apagar(p)}>Apagar</button>}
          </div>
        </div>))}
    </main>
  );
}
