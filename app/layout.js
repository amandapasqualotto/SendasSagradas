import { Playfair_Display, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";
const titulo = Playfair_Display({ subsets: ["latin"], variable: "--f-titulo" });
const texto = Lora({ subsets: ["latin"], variable: "--f-texto" });
export const metadata = { title: "Plano de Leitura da Bíblia" };
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`} suppressHydrationWarning>
      {/* aplica o tema escolhido (claro/escuro) antes de desenhar a página, para não piscar */}
      <head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.tema=t}catch(e){}` }} /></head>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
