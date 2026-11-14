// POST /api/significado { palavra, codigo, c, v, texto }
// Explica uma palavra no contexto do versículo. Cada explicação fica salva em
// significados/{palavra}_{COD}_{c}_{v} e é reaproveitada por todos os usuários.
import { getAdmin, usuarioDaRequisicao } from "@/lib/firebase-admin";
import { gerarJSON, MODELO, S, obj } from "@/lib/gemini";
import { porCodigo } from "@/lib/livros";

export const maxDuration = 60;
const SCHEMA = obj({ palavra: S, significado: S, noContexto: S, original: S });

const normalizar = (p) => p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z-]/g, "");

export async function POST(req) {
  const user = await usuarioDaRequisicao(req);
  if (!user) return Response.json({ erro: "Faça login." }, { status: 401 });

  const { palavra, codigo, c, v, texto } = await req.json().catch(() => ({}));
  const livro = porCodigo[codigo];
  if (!livro || !/^[\p{L}'-]{2,30}$/u.test(palavra || "") || !(c >= 1 && c <= livro.caps) || !(v >= 1 && v <= 200))
    return Response.json({ erro: "Pedido inválido" }, { status: 400 });

  const { db, FieldValue } = getAdmin();
  const ref = db.doc(`significados/${normalizar(palavra)}_${codigo}_${c}_${v}`);
  const s = await ref.get();
  if (s.exists) return Response.json(s.data());

  try {
    const r = await gerarJSON(
      `Você é um professor de Bíblia que explica palavras de forma simples, em português do Brasil.
Explique a palavra "${palavra}" como aparece em ${livro.nome} ${c}:${v}:
"${String(texto || "").slice(0, 600)}"

"significado": o significado geral da palavra (1 ou 2 frases).
"noContexto": o que ela quer dizer NESTE versículo, com o contexto bíblico (2 a 4 frases).
"original": o termo hebraico/aramaico (AT) ou grego (NT) por trás da palavra, com transliteração e sentido literal;
deixe vazio se não tiver certeza.`,
      SCHEMA, 0.3
    );
    const dados = { ...r, palavra, referencia: `${livro.nome} ${c}:${v}`, modelo: MODELO, criadoEm: FieldValue.serverTimestamp() };
    await ref.set(dados);
    return Response.json({ ...r, palavra, referencia: dados.referencia });
  } catch (e) {
    console.error("significado", e);
    return Response.json({ erro: "Não foi possível buscar o significado agora." }, { status: 500 });
  }
}
