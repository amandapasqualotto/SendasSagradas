"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useProgresso, diaAtual, TOTAL } from "@/lib/progresso";
import { porCodigo } from "@/lib/livros";
import { SUGERIDOS } from "@/lib/sugeridos";
import Nav from "@/components/Nav";

function Login() {
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [novo, setNovo] = useState(false); const [msg, setMsg] = useState("");
  async function enviar(e) {
    e.preventDefault(); setMsg("");
    try { novo ? await createUserWithEmailAndPassword(auth, email, senha) : await signInWithEmailAndPassword(auth, email, senha); }
    catch { setMsg("Não foi possível entrar. Confira e-mail e senha (mín. 6 caracteres)."); }
  }
  async function recuperar() {
    if (!email) return setMsg("Digite seu e-mail para recuperar a senha.");
    await sendPasswordResetEmail(auth, email).catch(() => {}); setMsg("Se o e-mail existir, enviamos um link de recuperação.");
  }
  return (
    <main><h1>Plano de Leitura da Bíblia</h1><div className="orn">❦ ❦ ❦</div>
      <form className="card" onSubmit={enviar}>
        <h2>{novo ? "Criar conta" : "Entrar"}</h2>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        {msg && <p className="erro">{msg}</p>}
        <button className="btn cheio" type="submit">{novo ? "Cadastrar" : "Entrar"}</button>{" "}
        <button className="btn" type="button" onClick={() => setNovo(!novo)}>{novo ? "Já tenho conta" : "Criar conta"}</button>
        {!novo && <p><a href="#" onClick={(e) => { e.preventDefault(); recuperar(); }}>Esqueci minha senha</a></p>}
      </form></main>
  );
}

const ICONES = { youtube: "▶", instagram: "◎", podcast: "🎙", site: "🔗", livro: "📚" };

function Inicio({ user }) {
  const feitos = useProgresso(user);
  const [perfil, setPerfil] = useState(null);
  const [posts, setPosts] = useState([]);
  const [nDest, setNDest] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "usuarios", user.uid)).then((s) => setPerfil(s.exists() ? s.data() : {}));
    getDocs(query(collection(db, "mural"), orderBy("criadoEm", "desc"), limit(3)))
      .then((s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
    getCountFromServer(collection(db, "usuarios", user.uid, "destaques"))
      .then((s) => setNDest(s.data().count)).catch(() => setNDest(0));
  }, [user.uid]);

  const atual = feitos ? diaAtual(feitos) : null;
  // mantém o "dia atual" usado pelos lembretes por e-mail sempre em dia
  useEffect(() => {
    if (perfil && atual && perfil.diaAtual !== atual) setDoc(doc(db, "usuarios", user.uid), { diaAtual: atual }, { merge: true });
  }, [perfil, atual, user.uid]);

  if (!feitos || !perfil) return <main><p>Carregando…</p></main>;
  const nome = (perfil.nome || "").split(" ")[0];
  const ub = perfil.ultimaBiblia;

  return (
    <main className="largo"><Nav />
      <h1>{nome ? `Olá, ${nome}!` : "Sendas Sagradas"}</h1><div className="orn">❦ ❦ ❦</div>
      <div className="cards">
        <section className="card">
          <h2>Plano de estudo</h2>
          <p>Você está no <strong>Dia {atual}</strong> de {TOTAL}.</p>
          <div className="barra"><div style={{ width: `${(feitos.size / TOTAL) * 100}%` }} /></div>
          <p className="peq">{feitos.size} dias concluídos</p>
          <p className="botoes">
            <Link className="btn cheio" href={`/dia/${atual}`}>Continuar</Link>
            <Link className="btn" href="/plano/visao-geral">Visão geral</Link>
          </p>
        </section>

        <section className="card">
          <h2>Bíblia</h2>
          <p>Leia livremente, livro por livro, com grifos, áudio e estudos.</p>
          <p className="botoes">
            {ub && porCodigo[ub.codigo] && <Link className="btn cheio" href={`/biblia/${ub.codigo.toLowerCase()}/${ub.cap}`}>Continuar em {porCodigo[ub.codigo].nome} {ub.cap}</Link>}
            <Link className="btn" href="/biblia#at">Antigo Testamento</Link>
            <Link className="btn" href="/biblia#nt">Novo Testamento</Link>
          </p>
        </section>

        <section className="card">
          <h2>Mural da comunidade</h2>
          {posts.length === 0 ? <p className="peq">Ainda não há publicações. Que tal ser a primeira pessoa?</p>
            : <ul className="previa">{posts.map((p) => (
                <li key={p.id}><strong>{p.nome}</strong>{p.referencia ? ` · ${p.referencia}` : ""}: {p.texto.slice(0, 110)}{p.texto.length > 110 ? "…" : ""}</li>))}</ul>}
          <p className="botoes"><Link className="btn" href="/mural">Abrir o mural</Link></p>
        </section>

        <section className="card">
          <h2>Meus destaques</h2>
          <p>{nDest ? `${nDest} versículo${nDest > 1 ? "s" : ""} grifado${nDest > 1 ? "s" : ""}.` : "Grife versículos durante a leitura para guardá-los aqui."}</p>
          <p className="botoes"><Link className="btn" href="/destaques">Ver destaques</Link></p>
        </section>
      </div>

      <h2 className="secao">Sugeridos</h2>
      <p className="peq" style={{ textAlign: "center" }}>Pessoas e canais que ajudam a aprofundar o estudo.</p>
      <div className="cards sugeridos">
        {SUGERIDOS.map((s) => (
          <a key={s.link} className="card sugerido" href={s.link} target="_blank" rel="noopener noreferrer">
            <span className="icone">{ICONES[s.tipo] || "🔗"}</span>
            <span><strong>{s.nome}</strong><br /><span className="peq">{s.descricao}</span></span>
          </a>))}
      </div>
    </main>
  );
}

export default function Page() {
  const { user, loading } = useAuth();
  if (loading) return <main><p>Carregando…</p></main>;
  return user ? <Inicio user={user} /> : <Login />;
}
