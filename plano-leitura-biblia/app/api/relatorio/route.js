// POST /api/relatorio { dia: 12 }
// Gera (uma única vez por dia do plano) o estudo aprofundado com o Gemini e guarda em
// Firestore: relatorios/{dia}. Todos os usuários passam a ler o mesmo estudo, então o custo
// com a IA é no máximo 365 gerações. A chave GEMINI_API_KEY fica só no servidor.
import { GoogleGenAI, Type } from "@google/genai";
import { getAdmin, usuarioDaRequisicao } from "@/lib/firebase-admin";
import plano from "@/data/plano-365-dias.json";

export const maxDuration = 60; // a geração leva ~20-40 s
const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const S = { type: Type.STRING };
const lista = (items) => ({ type: Type.ARRAY, items });
const obj = (properties) => ({ type: Type.OBJECT, properties, required: Object.keys(properties) });

const SCHEMA = obj({
  visaoGeral: S,
  mensagemPrincipal: S,
  ligacaoEntreLeituras: S,
  passagens: lista(obj({
    referencia: S,
    autoriaEData: S,
    contextoHistorico: S,
    resumo: S,
    personagens: lista(obj({ nome: S, descricao: S })),
    povosECulturas: S,
    geografia: lista(obj({ lugar: S, descricao: S })),
    conexoes: lista(obj({ referencia: S, explicacao: S })),
    versiculoChave: obj({ referencia: S, motivo: S }),
  })),
  glossario: lista(obj({ termo: S, significado: S })),
  aplicacoes: lista(S),
  perguntasReflexao: lista(S),
  oracao: S,
});

function montarPrompt(n, capitulos) {
  const leituras = capitulos.map((c) => {
    const texto = c.texto?.length
      ? "\n" + c.texto.map((v) => `${v.c}:${v.v} ${v.t}`).join("\n").slice(0, 25000)
      : "";
    return `### ${c.referencia}${texto}`;
  }).join("\n\n");
  return `Você é um professor de teologia bíblica e história do Antigo Oriente Próximo e do mundo greco-romano,
escrevendo para um aplicativo cristão de leitura bíblica em português do Brasil.
Prepare um ESTUDO APROFUNDADO do Dia ${n} do plano anual, que tem estas leituras:

${leituras}

Orientações:
- Para CADA passagem: autoria e data provável (indique quando há debate entre estudiosos), contexto histórico,
  político e social, resumo do que acontece, personagens principais, povos e costumes citados,
  geografia (lugares mencionados e onde ficam hoje), conexões com outras partes da Bíblia (com referências)
  e um versículo-chave.
- "ligacaoEntreLeituras": mostre como as leituras do dia conversam entre si.
- Seja fiel ao texto e historicamente cuidadoso; não invente datas, nomes ou referências.
  Quando algo for tradição ou hipótese, diga isso.
- Tom acolhedor, sem jargão desnecessário, adequado a cristãos de diferentes denominações.
- "glossario": termos difíceis do texto. "aplicacoes": 3 a 5 aplicações práticas.
  "perguntasReflexao": 3 a 5 perguntas. "oracao": uma oração curta baseada nas leituras.`;
}

export async function POST(req) {
  const user = await usuarioDaRequisicao(req);
  if (!user) return Response.json({ erro: "Faça login." }, { status: 401 });

  const { dia } = await req.json().catch(() => ({}));
  const n = Number(dia);
  if (!plano.dias.some((d) => d.numero === n)) return Response.json({ erro: "Dia inválido" }, { status: 400 });

  const { db, FieldValue } = getAdmin();
  const ref = db.doc(`relatorios/${n}`);

  // Trava simples para duas pessoas não gerarem o mesmo dia ao mesmo tempo
  const pode = await db.runTransaction(async (t) => {
    const s = await t.get(ref);
    if (s.exists) {
      const r = s.data();
      if (r.status === "pronto") return "pronto";
      const idade = Date.now() - (r.iniciadoEm?.toMillis?.() || 0);
      if (r.status === "gerando" && idade < 120000) return "gerando";
    }
    t.set(ref, { status: "gerando", iniciadoEm: FieldValue.serverTimestamp() });
    return "ok";
  });
  if (pode !== "ok") return Response.json({ status: pode });

  try {
    const diaDoc = await db.doc(`dias/${n}`).get();
    const capitulos = diaDoc.exists ? diaDoc.data().capitulos : plano.dias.find((d) => d.numero === n).capitulos;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const resp = await ai.models.generateContent({
      model: MODELO,
      contents: montarPrompt(n, capitulos),
      config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.4 },
    });
    const estudo = JSON.parse(resp.text);

    await ref.set({ status: "pronto", ...estudo, modelo: MODELO, geradoEm: FieldValue.serverTimestamp() });
    return Response.json({ status: "pronto" });
  } catch (e) {
    console.error("Erro ao gerar relatório", e);
    await ref.delete().catch(() => {});
    return Response.json({ erro: "Não foi possível gerar o estudo agora. Tente de novo." }, { status: 500 });
  }
}
