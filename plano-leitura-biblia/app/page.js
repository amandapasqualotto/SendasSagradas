"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
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

const TOTAL = 365;
const DIAS = Array.from({ length: TOTAL }, (_, i) => i + 1);

function Lembretes({ user, atual }) {
  const [p, setP] = useState(null); const [ok, setOk] = useState("");
  useEffect(() => {
    getDoc(doc(db, "usuarios", user.uid)).then((s) => {
      setP({ notificacoesAtivas: false, horaLembrete: 7, nome: "", ...(s.exists() ? s.data() : {}) });
      // mantém o "dia atual" usado pelos lembretes sempre em dia
      if (s.exists() && s.data().diaAtual !== atual) setDoc(doc(db, "usuarios", user.uid), { diaAtual: atual }, { merge: true });
    });
  }, [user.uid, atual]);
  async function salvar(mudanca) {
    const novo = { ...p, ...mudanca }; setP(novo);
    await setDoc(doc(db, "usuarios", user.uid), {
      notificacoesAtivas: !!novo.notificacoesAtivas, horaLembrete: Number(novo.horaLembrete),
      nome: (novo.nome || "").slice(0, 60), email: user.email, diaAtual: atual,
    }, { merge: true });
    setOk("Salvo ✓"); setTimeout(() => setOk(""), 1500);
  }
  if (!p) return null;
  return (
    <div className="card" id="lembretes"><h2>Lembrete diário</h2>
      <label><input type="checkbox" style={{ width: "auto" }} checked={!!p.notificacoesAtivas}
        onChange={(e) => salvar({ notificacoesAtivas: e.target.checked })} /> Quero receber por e-mail um lembrete da leitura do dia</label>
      <p className="peq">Enviado para {user.email} todos os dias às 21h (horário de Brasília). Se você já leu no dia, o lembrete não é enviado.</p>      <label className="peq">Seu nome no mural</label>
      <input value={p.nome} maxLength={60} placeholder="Como você quer aparecer para os outros"
        onChange={(e) => setP({ ...p, nome: e.target.value })} onBlur={() => salvar({})} />
      {ok && <p className="peq">{ok}</p>}
    </div>
  );
}

function Home({ user }) {
  const [feitos, setFeitos] = useState(null);
  useEffect(() => {
    getDocs(collection(db, "usuarios", user.uid, "progresso")).then((s) =>
      setFeitos(new Set(s.docs.filter((d) => d.data().concluido).map((d) => Number(d.id)))));
  }, [user.uid]);
  if (!feitos) return <main><p>Carregando…</p></main>;
  const atual = DIAS.find((n) => !feitos.has(n)) ?? TOTAL;
  return (
    <main><h1>Dia {atual} de {TOTAL}</h1><div className="orn">❦ ❦ ❦</div>
      <div className="card"><div className="barra"><div style={{ width: `${(feitos.size / TOTAL) * 100}%` }} /></div>
        <p className="peq">{feitos.size} dias concluídos</p>
        <Link className="btn cheio" href={`/dia/${atual}`}>Continuar</Link>{" "}
        <Link className="btn" href="/mural">Mural da comunidade</Link></div>
      <div className="grade">{DIAS.map((n) => (
        <Link key={n} href={`/dia/${n}`} className={`dia ${feitos.has(n) ? "ok" : ""} ${n === atual ? "atual" : ""}`}>{n}</Link>))}</div>
      <Lembretes user={user} atual={atual} />
      <p style={{ textAlign: "center", marginTop: 30 }}><button className="btn" onClick={() => signOut(auth)}>Sair</button></p></main>
  );
}

export default function Page() {
  const { user, loading } = useAuth();
  if (loading) return <main><p>Carregando…</p></main>;
  return user ? <Home user={user} /> : <Login />;
}
