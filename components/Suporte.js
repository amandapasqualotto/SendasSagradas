"use client";
import { useState } from "react";

// O e-mail do suporte vem da variável NEXT_PUBLIC_EMAIL_SUPORTE (.env.local e Vercel)
const EMAIL = process.env.NEXT_PUBLIC_EMAIL_SUPORTE || "";

export default function Suporte({ user }) {
  const [copiado, setCopiado] = useState(false);
  if (!EMAIL) return null;
  const corpo = `Olá! Preciso de ajuda com:\n\n\n\n---\nConta: ${user.email}`;
  const link = `mailto:${EMAIL}?subject=${encodeURIComponent("Suporte - Sendas Sagradas")}&body=${encodeURIComponent(corpo)}`;
  async function copiar() {
    await navigator.clipboard.writeText(EMAIL).catch(() => {});
    setCopiado(true); setTimeout(() => setCopiado(false), 1500);
  }
  return (
    <div className="card" id="suporte"><h2>Fale com o suporte</h2>
      <p>Encontrou um erro, tem uma dúvida ou uma sugestão? Manda uma mensagem pra gente.</p>
      <p className="botoes"><a className="btn cheio" href={link}>✉️ Enviar e-mail</a></p>
      <p className="peq">Se o botão não abrir o seu e-mail, escreva para <strong>{EMAIL}</strong>{" "}
        <button className="btn peq" onClick={copiar}>{copiado ? "Copiado ✓" : "Copiar"}</button></p>
    </div>
  );
}
