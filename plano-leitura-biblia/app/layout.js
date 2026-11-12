import { Playfair_Display, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";
const titulo = Playfair_Display({ subsets: ["latin"], variable: "--f-titulo" });
const texto = Lora({ subsets: ["latin"], variable: "--f-texto" });
export const metadata = { title: "Plano de Leitura da Bíblia" };
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`}>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
