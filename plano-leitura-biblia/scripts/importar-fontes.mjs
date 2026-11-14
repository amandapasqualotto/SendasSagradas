// Envia ao Firestore os materiais de apoio já processados (data/fontes-sendas.json.gz):
//   fontes_expositor/{LIVRO}_{capítulo}  e  fontes_panorama/{LIVRO}
// Uso: npm run importar-fontes
import admin from "firebase-admin";
import fs from "fs";
import zlib from "zlib";

const cred = JSON.parse(fs.readFileSync(process.env.SERVICE_ACCOUNT || "service-account.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(cred) });
const db = admin.firestore();

const arquivo = process.argv[2] || "data/fontes-sendas.json.gz";
const { expositor, panorama } = JSON.parse(zlib.gunzipSync(fs.readFileSync(arquivo)).toString("utf8"));

const docs = [];
for (const [cod, caps] of Object.entries(expositor))
  for (const [c, t] of Object.entries(caps)) docs.push([`fontes_expositor/${cod}_${c}`, { t }]);
for (const [cod, trechos] of Object.entries(panorama)) docs.push([`fontes_panorama/${cod}`, { trechos }]);

// lotes pequenos por causa do tamanho dos documentos
for (let i = 0; i < docs.length; i += 20) {
  const b = db.batch();
  docs.slice(i, i + 20).forEach(([caminho, dados]) => b.set(db.doc(caminho), dados));
  await b.commit();
  if ((i / 20) % 10 === 0) console.log(`…${Math.min(i + 20, docs.length)} de ${docs.length}`);
}
console.log(`Pronto: ${docs.length} documentos de fontes importados.`);
