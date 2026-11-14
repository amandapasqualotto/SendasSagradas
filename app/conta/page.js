"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import Nav from "@/components/Nav";
import Tema from "@/components/Tema";
import Suporte from "@/components/Suporte";

export default function Conta() {
  const { user, loading } = useAuth();
  const [p, setP] = useState(null); const [ok, setOk] = useState("");
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "usuarios", user.uid)).then((s) => setP({ notificacoesAtivas: false, nome: "", ...(s.exists() ? s.data() : {}) }));
  }, [user]);
  async function salvar(mudanca) {
    const novo = { ...p, ...mudanca }; setP(novo);
    await setDoc(doc(db, "usuarios", user.uid), {
      notificacoesAtivas: !!novo.notificacoesAtivas, nome: (novo.nome || "").slice(0, 60), email: user.email,
    }, { merge: true });
    setOk("Salvo ✓"); setTimeout(() => setOk(""), 1500);
  }
  if (loading) return <main><p>Carregando…</p></main>;
  if (!user) return <main><p><Link href="/">Entre para continuar</Link></p></main>;
  if (!p) return <main><Nav /><p>Carregando…</p></main>;
  return (
    <main><Nav /><h1>Minha conta</h1><div className="orn">❦ ❦ ❦</div>
      <div className="card">
        <h2>Seu nome</h2>
        <input value={p.nome} maxLength={60} placeholder="Como você quer aparecer no app e no mural"
          onChange={(e) => setP({ ...p, nome: e.target.value })} onBlur={() => salvar({})} />
      </div>
      <div className="card" id="lembretes"><h2>Lembrete diário</h2>
        <label><input type="checkbox" style={{ width: "auto" }} checked={!!p.notificacoesAtivas}
          onChange={(e) => salvar({ notificacoesAtivas: e.target.checked })} /> Quero receber por e-mail um lembrete da leitura do dia</label>
        <p className="peq">Enviado para {user.email} todos os dias às 21h (horário de Brasília). Se você já leu no dia, o lembrete não é enviado.</p>
      </div>
      <div className="card"><h2>Aparência</h2>
        <Tema completo />
        <p className="peq">"Automático" segue o tema claro/escuro do seu celular ou computador.</p>
      </div>
      <Suporte user={user} />
      {ok && <p className="peq" style={{ textAlign: "center" }}>{ok}</p>}
      <p style={{ textAlign: "center" }}><button className="btn" onClick={() => signOut(auth)}>Sair</button></p>
    </main>
  );
}
