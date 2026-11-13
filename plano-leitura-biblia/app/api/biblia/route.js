// GET /api/biblia?dia=12 -> texto bíblico das leituras do dia, buscado na internet.
// É o "plano B": só é chamado quando o texto ainda não foi importado para o Firestore.
// A resposta fica em cache na CDN da Vercel, então cada dia é buscado uma única vez.
import plano from "@/data/plano-365-dias.json";
import { buscarPassagem, CREDITO } from "@/lib/biblia.mjs";

export const maxDuration = 30;
const CACHE = { next: { revalidate: 60 * 60 * 24 * 30 } };

export async function GET(req) {
  const n = Number(new URL(req.url).searchParams.get("dia"));
  const dia = plano.dias.find((d) => d.numero === n);
  if (!dia) return Response.json({ erro: "Dia inválido" }, { status: 400 });
  try {
    const capitulos = await Promise.all(
      dia.capitulos.map(async (c) => ({ referencia: c.referencia, texto: await buscarPassagem(c, CACHE) }))
    );
    return Response.json(
      { capitulos, credito: CREDITO },
      { headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" } }
    );
  } catch (e) {
    console.error(e);
    return Response.json({ erro: "Não foi possível buscar o texto bíblico agora." }, { status: 502 });
  }
}
