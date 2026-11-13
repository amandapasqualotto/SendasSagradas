// GET /api/lembretes  (chamado pelo n8n a cada hora)
// Header obrigatório: x-lembrete-secret: <LEMBRETES_SECRET>
// Devolve quem deve receber lembrete NESTA hora, já com assunto e corpo do e-mail prontos.
// Parâmetros opcionais (para testar): ?hora=7  ou  ?todos=1 (ignora horário e leitura do dia)
import { getAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
const TZ = process.env.LEMBRETES_TZ || "America/Sao_Paulo";

const dataNoFuso = (d) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // AAAA-MM-DD
const horaNoFuso = (d) => Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(d));
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function GET(req) {
  if (!process.env.LEMBRETES_SECRET || req.headers.get("x-lembrete-secret") !== process.env.LEMBRETES_SECRET)
    return Response.json({ erro: "Não autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const agora = new Date();
  const todos = url.searchParams.get("todos") === "1";
  const hora = url.searchParams.has("hora") ? Number(url.searchParams.get("hora")) : horaNoFuso(agora);
  const hoje = dataNoFuso(agora);
  const appUrl = process.env.APP_URL || url.origin;

  const { db, auth } = getAdmin();
  let q = db.collection("usuarios").where("notificacoesAtivas", "==", true);
  const diario = url.searchParams.get("diario") === "1";
  if (!todos && !diario) q = q.where("horaLembrete", "==", hora);
  const snap = await q.get();

  const cacheDias = {};
  const lembretes = [];
  for (const u of snap.docs) {
    const p = u.data();
    const leuHoje = p.ultimaLeitura?.toDate && dataNoFuso(p.ultimaLeitura.toDate()) === hoje;
    if (leuHoje && !todos) continue;

    const dia = p.diaAtual || 1;
    if (!cacheDias[dia]) {
      const d = await db.doc(`dias/${dia}`).get();
      cacheDias[dia] = d.exists ? d.data().capitulos.map((c) => c.referencia).join(" · ") : "";
    }
    const email = p.email || (await auth.getUser(u.id).catch(() => null))?.email;
    if (!email) continue;

    const nome = (p.nome || "").split(" ")[0];
    const link = `${appUrl}/dia/${dia}`;
    lembretes.push({
      email, nome, dia, leituras: cacheDias[dia], link,
      assunto: `📖 Dia ${dia} da sua leitura bíblica`,
      html: `<div style="font-family:Georgia,serif;color:#4a3426;max-width:520px">
  <p>Olá${nome ? `, ${esc(nome)}` : ""}!</p>
  <p>Hoje é o <strong>Dia ${dia}</strong> do seu plano de leitura:</p>
  <p style="font-size:18px;color:#7a2e3a"><strong>${esc(cacheDias[dia])}</strong></p>
  <p>Reserve alguns minutos para ler e abrir o estudo aprofundado do dia.</p>
  <p><a href="${link}" style="background:#7a2e3a;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none">Ler agora</a></p>
  <p style="font-size:12px;opacity:.7">Para parar de receber, desmarque o lembrete na página inicial do app.</p>
</div>`,
    });
  }
  return Response.json({ hora, fuso: TZ, total: lembretes.length, lembretes });
}
