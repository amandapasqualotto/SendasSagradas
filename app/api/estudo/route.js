// POST /api/estudo { id }
// Gera com o Gemini (uma única vez) e guarda em Firestore: estudos/{id}.
//   t_GEN_1-2     -> estudo de um trecho (usado no plano e na Bíblia em ordem)
//   d12_geral     -> visão geral do Dia 12
//   d12_oracao    -> oração e reflexões do Dia 12
// Os estudos de trecho usam também os materiais de apoio importados (PDFs).
import { getAdmin, usuarioDaRequisicao } from "@/lib/firebase-admin";
import { gerarJSON, MODELO, S, lista, obj } from "@/lib/gemini";
import { lerId } from "@/lib/estudos";
import { porCodigo, referencia } from "@/lib/livros";
import { buscarPorCodigo } from "@/lib/biblia.mjs";
import { buscarFontes } from "@/lib/fontes";
import plano from "@/data/plano-365-dias.json";

export const maxDuration = 120;

const PAPEL = `Você é um professor de teologia bíblica e de história do Antigo Oriente Próximo e do mundo greco-romano,
escrevendo para um aplicativo cristão de leitura bíblica em português do Brasil.
Tom acolhedor, claro, sem jargão desnecessário, adequado a cristãos de diferentes denominações.
Seja fiel ao texto e historicamente cuidadoso: não invente datas, nomes ou referências; quando algo for
tradição ou hipótese, diga isso.`;

const SCHEMAS = {
  trecho: obj({
    resumo: S,
    autoriaEData: S,
    contextoHistorico: S,
    personagens: lista(obj({ nome: S, descricao: S })),
    povosECulturas: S,
    geografia: lista(obj({ lugar: S, descricao: S })),
    conexoes: lista(obj({ referencia: S, explicacao: S })),
    versiculoChave: obj({ referencia: S, motivo: S }),
    glossario: lista(obj({ termo: S, significado: S })),
    mensagem: S,
  }),
  geral: obj({ oQueEsperar: S, ligacaoEntreLeituras: S, mensagemPrincipal: S, temas: lista(S) }),
  oracao: obj({ aplicacoes: lista(S), perguntasReflexao: lista(S), oracao: S }),
};

async function montar(info, db) {
  if (info.tipo === "trecho") {
    const ref = referencia(info.codigo, info.c1, info.c2, info.vers);
    const versos = await buscarPorCodigo(info.codigo, info.c1, info.c2, info.vers);
    const texto = versos.map((v) => `${v.c}:${v.v} ${v.t}`).join("\n").slice(0, 30000);
    const fontes = await buscarFontes(db, info.codigo, info.c1, info.c2);
    return {
      referencia: ref,
      prompt: `${PAPEL}

Prepare o ESTUDO de ${ref}. Texto bíblico (Bíblia Livre):
${texto}
${fontes ? `
MATERIAIS DE APOIO (da biblioteca do app; podem ter erros de tradução automática e refletem a visão dos seus autores):
${fontes}

Use esses materiais como referência adicional: sintetize com suas palavras, não copie frases inteiras e,
quando trouxerem uma interpretação própria de uma tradição, apresente-a como uma das leituras possíveis.
` : ""}
Inclua: resumo do que acontece; autoria e data provável (indique quando há debate); contexto histórico, político e social;
personagens principais; povos e costumes citados; geografia (lugares mencionados e onde ficam hoje); conexões com outras
partes da Bíblia (com referências); um versículo-chave; glossário dos termos difíceis; e a mensagem central do trecho.`,
    };
  }
  const dia = plano.dias.find((d) => d.numero === info.dia);
  const refs = dia.capitulos.map((c) => c.referencia).join("; ");
  if (info.tipo === "geral") {
    return {
      referencia: `Dia ${info.dia}`,
      prompt: `${PAPEL}

Escreva a VISÃO GERAL do Dia ${info.dia} do plano anual de leitura, com as leituras: ${refs}.
"oQueEsperar": o que a pessoa vai encontrar hoje, em um parágrafo convidativo.
"ligacaoEntreLeituras": como as leituras do dia conversam entre si.
"mensagemPrincipal": a mensagem central do dia, em uma ou duas frases.
"temas": 3 a 5 temas do dia (palavras ou expressões curtas).`,
    };
  }
  return {
    referencia: `Dia ${info.dia}`,
    prompt: `${PAPEL}

Prepare o momento de ORAÇÃO E REFLEXÃO do Dia ${info.dia} do plano anual de leitura, com as leituras: ${refs}.
"aplicacoes": 3 a 5 aplicações práticas para a vida hoje.
"perguntasReflexao": 3 a 5 perguntas para meditar ou conversar em grupo.
"oracao": uma oração curta, em primeira pessoa, baseada nas leituras.`,
  };
}

function valido(info) {
  if (!info) return false;
  if (info.tipo === "trecho") {
    const l = porCodigo[info.codigo];
    return l && info.c1 >= 1 && info.c1 <= info.c2 && info.c2 <= l.caps && info.c2 - info.c1 <= 6;
  }
  return plano.dias.some((d) => d.numero === info.dia);
}

export async function POST(req) {
  const user = await usuarioDaRequisicao(req);
  if (!user) return Response.json({ erro: "Faça login." }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  const info = lerId(id);
  if (!valido(info)) return Response.json({ erro: "Estudo inválido" }, { status: 400 });

  const { db, FieldValue } = getAdmin();
  const ref = db.doc(`estudos/${id}`);

  // Trava para duas pessoas não gerarem o mesmo estudo ao mesmo tempo
  const pode = await db.runTransaction(async (t) => {
    const s = await t.get(ref);
    if (s.exists) {
      const r = s.data();
      if (r.status === "pronto") return "pronto";
      const idade = Date.now() - (r.iniciadoEm?.toMillis?.() || 0);
      if (r.status === "gerando" && idade < 150000) return "gerando";
    }
    t.set(ref, { status: "gerando", iniciadoEm: FieldValue.serverTimestamp() });
    return "ok";
  });
  if (pode !== "ok") return Response.json({ status: pode });

  try {
    const { prompt, referencia: refTxt } = await montar(info, db);
    const estudo = await gerarJSON(prompt, SCHEMAS[info.tipo]);
    await ref.set({
      status: "pronto", tipo: info.tipo, referencia: refTxt, ...estudo,
      modelo: MODELO, geradoEm: FieldValue.serverTimestamp(),
    });
    return Response.json({ status: "pronto" });
  } catch (e) {
    console.error("Erro ao gerar estudo", id, e);
    await ref.delete().catch(() => {});
    return Response.json({ erro: "Não foi possível gerar o estudo agora. Tente de novo." }, { status: 500 });
  }
}
