// Baixa o texto bíblico de cada leitura do plano e gera data/plano-com-textos.json
// Uso:
//   npm run textos              -> baixa tudo (alguns minutos)
//   npm run textos -- --teste   -> só o Dia 1, mostra uma prévia e não grava nada
//   npm run textos -- --listar  -> lista as traduções em português disponíveis
// Depois rode `npm run importar` para mandar tudo ao Firestore.
import fs from "fs";
import { buscarPassagem, idTraducao, listarTraducoesPt, CREDITO } from "../lib/biblia.mjs";

const args = process.argv.slice(2);
if (args.includes("--listar")) {
  console.table(await listarTraducoesPt());
  process.exit(0);
}

const plano = JSON.parse(fs.readFileSync("data/plano-365-dias.json", "utf8"));
const teste = args.includes("--teste");
const dias = teste ? plano.dias.slice(0, 1) : plano.dias;
const traducao = await idTraducao();
console.log(`Tradução usada: ${traducao}`);

const PARALELO = 4;
let feitos = 0;
const fila = dias.flatMap((d) => d.capitulos.map((c) => c));
async function trabalhador() {
  while (fila.length) {
    const item = fila.shift();
    item.texto = await buscarPassagem(item);
    item.traducao = traducao;
    if (++feitos % 30 === 0) console.log(`${feitos} leituras baixadas…`);
  }
}
await Promise.all(Array.from({ length: PARALELO }, trabalhador));

if (teste) {
  for (const c of dias[0].capitulos) {
    console.log(`\n== ${c.referencia}: ${c.texto.length} versículos`);
    console.log(c.texto.slice(0, 3).map((v) => `${v.c}:${v.v} ${v.t}`).join("\n"));
  }
  process.exit(0);
}

plano.credito = CREDITO;
fs.writeFileSync("data/plano-com-textos.json", JSON.stringify(plano));
console.log(`Pronto: ${feitos} leituras em data/plano-com-textos.json. Agora rode: npm run importar`);
