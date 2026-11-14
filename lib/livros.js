// Lista dos 66 livros (código USFM, nome, nº de capítulos, testamento)
import lista from "./livros.json";
import { LIVROS as NOMES_PLANO } from "./biblia.mjs";

export const LIVROS_BIBLIA = lista.map(([codigo, nome, caps, t]) => ({ codigo, nome, caps, t }));
export const porCodigo = Object.fromEntries(LIVROS_BIBLIA.map((l) => [l.codigo, l]));
export const codigoDoPlano = (nome) => NOMES_PLANO[nome];

export function referencia(codigo, c1, c2, vers) {
  const nome = porCodigo[codigo]?.nome || codigo;
  const caps = c1 === c2 ? `${c1}` : `${c1}-${c2}`;
  return `${nome} ${caps}${vers ? `:${vers}` : ""}`;
}
