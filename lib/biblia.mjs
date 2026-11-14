// Busca o texto bíblico na "Free Use Bible API" (https://bible.helloao.org),
// gratuita, sem chave e sem limite rígido de requisições.
// Tradução padrão: Bíblia Livre (BLIVRE) — licença Creative Commons Atribuição,
// por isso o app exibe o crédito no rodapé de cada leitura.
// Usado tanto pelo script `npm run textos` quanto pela rota /api/biblia.

const BASE = "https://bible.helloao.org/api";

// Nome do livro no plano (português) -> código USFM usado pela API
export const LIVROS = {
  "Gênesis": "GEN", "Êxodo": "EXO", "Levítico": "LEV", "Números": "NUM", "Deuteronômio": "DEU",
  "Josué": "JOS", "Juízes": "JDG", "Rute": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Reis": "1KI", "2 Reis": "2KI", "1 Crônicas": "1CH", "2 Crônicas": "2CH", "Esdras": "EZR",
  "Neemias": "NEH", "Ester": "EST", "Jó": "JOB", "Salmo": "PSA", "Salmos": "PSA", "Provérbios": "PRO",
  "Eclesiastes": "ECC", "Cântico dos Cânticos": "SNG", "Isaías": "ISA", "Jeremias": "JER",
  "Lamentações": "LAM", "Ezequiel": "EZK", "Daniel": "DAN", "Oséias": "HOS", "Joel": "JOL",
  "Amós": "AMO", "Obadias": "OBA", "Jonas": "JON", "Miquéias": "MIC", "Naum": "NAM",
  "Habacuque": "HAB", "Sofonias": "ZEP", "Ageu": "HAG", "Zacarias": "ZEC", "Malaquias": "MAL",
  "Mateus": "MAT", "Marcos": "MRK", "Lucas": "LUK", "João": "JHN", "Atos": "ACT", "Romanos": "ROM",
  "1 Coríntios": "1CO", "2 Coríntios": "2CO", "Gálatas": "GAL", "Efésios": "EPH", "Filipenses": "PHP",
  "Colossenses": "COL", "1 Tessalonicenses": "1TH", "2 Tessalonicenses": "2TH", "1 Timóteo": "1TI",
  "2 Timóteo": "2TI", "Tito": "TIT", "Filemom": "PHM", "Hebreus": "HEB", "Tiago": "JAS",
  "1 Pedro": "1PE", "2 Pedro": "2PE", "1 João": "1JN", "2 João": "2JN", "3 João": "3JN",
  "Judas": "JUD", "Apocalipse": "REV",
};

export const CREDITO =
  "Texto bíblico: Bíblia Livre (BLIVRE) © Diego Santos, Mario Sérgio e Marco Teles — licença Creative Commons Atribuição.";

// `opts` é repassado ao fetch (no Next.js usamos { next: { revalidate } } para cachear)
async function getJson(url, opts = {}) {
  for (let tentativa = 1; ; tentativa++) {
    const r = await fetch(url, opts);
    if (r.ok) return r.json();
    if (tentativa >= 3 || r.status === 404) throw new Error(`HTTP ${r.status} em ${url}`);
    await new Promise((ok) => setTimeout(ok, 1000 * tentativa));
  }
}

let traducaoCache = null;
// Descobre o ID da Bíblia Livre na API (ou usa BIBLIA_TRADUCAO, se definido).
export async function idTraducao(opts) {
  if (process.env.BIBLIA_TRADUCAO) return process.env.BIBLIA_TRADUCAO;
  if (traducaoCache) return traducaoCache;
  const { translations } = await getJson(`${BASE}/available_translations.json`, opts);
  const por = translations.filter((t) => (t.language || "").startsWith("por"));
  const nome = (t) => `${t.name} ${t.englishName || ""} ${t.shortName || ""}`;
  const escolhida =
    por.find((t) => /b[ií]blia livre|blivre/i.test(nome(t)) && !/para todos/i.test(nome(t))) || por[0];
  if (!escolhida) throw new Error("Nenhuma tradução em português encontrada na API.");
  traducaoCache = escolhida.id;
  return traducaoCache;
}

export async function listarTraducoesPt() {
  const { translations } = await getJson(`${BASE}/available_translations.json`);
  return translations
    .filter((t) => (t.language || "").startsWith("por"))
    .map((t) => ({ id: t.id, nome: t.name, ingles: t.englishName, livros: t.numberOfBooks }));
}

const livrosCache = {};
export async function numCapitulos(traducao, codigo, opts) {
  if (!livrosCache[traducao]) {
    const { books } = await getJson(`${BASE}/${traducao}/books.json`, opts);
    livrosCache[traducao] = Object.fromEntries(books.map((b) => [b.id, b.numberOfChapters]));
  }
  return livrosCache[traducao][codigo] || 1;
}

// Converte o "content" de um versículo da API em texto puro
function textoDe(partes) {
  return (partes || [])
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p.text === "string") return p.text;
      if (p && p.lineBreak) return "\n";
      return ""; // notas de rodapé, títulos internos etc.
    })
    .join(" ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export async function buscarCapitulo(traducao, codigo, cap, opts) {
  const d = await getJson(`${BASE}/${traducao}/${codigo}/${cap}.json`, opts);
  return (d.chapter?.content || [])
    .filter((b) => b.type === "verse")
    .map((b) => ({ c: cap, v: b.number, t: textoDe(b.content) }));
}

// Busca um trecho pelo código do livro: [{ c, v, t }]
export async function buscarPorCodigo(codigo, c1, c2, vers, opts) {
  const traducao = await idTraducao(opts);
  const versos = [];
  for (let c = c1; c <= c2; c++) versos.push(...(await buscarCapitulo(traducao, codigo, c, opts)));
  if (vers) {
    const [a, b] = String(vers).split("-").map(Number);
    return versos.filter((x) => x.v >= a && x.v <= (b || a));
  }
  return versos;
}

// Recebe um item de `capitulos` do plano e devolve [{ c, v, t }]
export async function buscarPassagem(item, opts) {
  const codigo = LIVROS[item.livro];
  if (!codigo) throw new Error(`Livro sem código: ${item.livro}`);
  const traducao = await idTraducao(opts);
  const ini = item.livroInteiro ? 1 : item.capInicio;
  const fim = item.livroInteiro ? await numCapitulos(traducao, codigo, opts) : item.capFim;
  return buscarPorCodigo(codigo, ini, fim, item.versiculos, opts);
}
