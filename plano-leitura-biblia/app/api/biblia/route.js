// GET /api/biblia?dia=12          -> texto das leituras do Dia 12 do plano
// GET /api/biblia?livro=GEN&cap=3 -> um capítulo (usado na Bíblia em ordem)
// Respostas ficam em cache na CDN da Vercel.
import plano from "@/data/plano-365-dias.json";
import { buscarPassagem, buscarPorCodigo, CREDITO } from "@/lib/biblia.mjs";
import { porCodigo } from "@/lib/livros";

export const maxDuration = 30;
const CACHE = { next: { revalidate: 60 * 60 * 24 * 30 } };
const HEADERS = { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" };

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  try {
    if (q.has("livro")) {
      const codigo = (q.get("livro") || "").toUpperCase();
      const cap = Number(q.get("cap"));
      const livro = porCodigo[codigo];
      if (!livro || !(cap >= 1 && cap <= livro.caps)) return Response.json({ erro: "Capítulo inválido" }, { status: 400 });
      const texto = await buscarPorCodigo(codigo, cap, cap, null, CACHE);
      return Response.json({ texto, credito: CREDITO }, { headers: HEADERS });
    }
    const n = Number(q.get("dia"));
    const dia = plano.dias.find((d) => d.numero === n);
    if (!dia) return Response.json({ erro: "Dia inválido" }, { status: 400 });
    const capitulos = await Promise.all(
      dia.capitulos.map(async (c) => ({ referencia: c.referencia, texto: await buscarPassagem(c, CACHE) }))
    );
    return Response.json({ capitulos, credito: CREDITO }, { headers: HEADERS });
  } catch (e) {
    console.error(e);
    return Response.json({ erro: "Não foi possível buscar o texto bíblico agora." }, { status: 502 });
  }
}
