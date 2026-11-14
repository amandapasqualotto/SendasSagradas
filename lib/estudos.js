// IDs dos estudos gerados pela IA (coleção "estudos"), usados no cliente e no servidor.
//  t_GEN_1-2        -> estudo de um trecho (Gênesis 1-2)
//  t_PSA_119-119_v1-88 -> trecho com versículos
//  d12_geral / d12_oracao -> visão geral e oração/reflexões do Dia 12
export const idTrecho = (codigo, c1, c2, vers) => `t_${codigo}_${c1}-${c2}${vers ? `_v${vers}` : ""}`;
export const idDia = (n, parte) => `d${n}_${parte}`;

export function lerId(id) {
  let m = /^t_([1-3A-Z]{3})_(\d{1,3})-(\d{1,3})(?:_v(\d{1,3})-(\d{1,3}))?$/.exec(id || "");
  if (m) return { tipo: "trecho", codigo: m[1], c1: +m[2], c2: +m[3], vers: m[4] ? `${m[4]}-${m[5]}` : null };
  m = /^d(\d{1,3})_(geral|oracao)$/.exec(id || "");
  if (m) return { tipo: m[2], dia: +m[1] };
  return null;
}
