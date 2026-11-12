"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

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

function Home({ user }) {
  const [dias, setDias] = useState([]); const [feitos, setFeitos] = useState(new Set());
  useEffect(() => {
    getDocs(collection(db, "usuarios", user.uid, "progresso")).then((s) =>
      setFeitos(new Set(s.docs.filter((d) => d.data().concluido).map((d) => Number(d.id)))));
    getDocs(collection(db, "dias")).then((s) => setDias(s.docs.map((d) => d.data().numero).sort((a, b) => a - b)));
  }, [user.uid]);
  const total = 365; const atual = dias.find((n) => !feitos.has(n)) ?? 1;
  return (
    <main><h1>Dia {atual} de {total}</h1><div className="orn">❦ ❦ ❦</div>
      <div className="card"><div className="barra"><div style={{ width: `${(feitos.size / total) * 100}%` }} /></div>
        <p className="peq">{feitos.size} dias concluídos</p>
        <Link className="btn cheio" href={`/dia/${atual}`}>Continuar</Link></div>
      <div className="grade">{dias.map((n) => (
        <Link key={n} href={`/dia/${n}`} className={`dia ${feitos.has(n) ? "ok" : ""} ${n === atual ? "atual" : ""}`}>{n}</Link>))}</div>
      <p style={{ textAlign: "center", marginTop: 30 }}><button className="btn" onClick={() => signOut(auth)}>Sair</button></p></main>
  );
}

export default function Page() {
  const { user, loading } = useAuth();
  if (loading) return <main><p>Carregando…</p></main>;
  return user ? <Home user={user} /> : <Login />;
}
