"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [["/", "Início"], ["/plano", "Plano"], ["/biblia", "Bíblia"], ["/mural", "Mural"], ["/destaques", "Destaques"], ["/conta", "Conta"]];

export default function Nav() {
  const p = usePathname();
  const ativo = (h) => (h === "/" ? p === "/" : p.startsWith(h) || (h === "/plano" && p.startsWith("/dia")));
  return (
    <nav className="nav">
      {LINKS.map(([h, t]) => <Link key={h} href={h} className={ativo(h) ? "ativo" : ""}>{t}</Link>)}
    </nav>
  );
}
