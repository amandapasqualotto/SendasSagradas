import admin from "firebase-admin";
import fs from "fs";
const cred = JSON.parse(fs.readFileSync(process.env.SERVICE_ACCOUNT || "service-account.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(cred) });
const db = admin.firestore();
// Usa o plano com textos bíblicos, se já tiver sido gerado com `npm run textos`
const arquivo = process.argv[2] || (fs.existsSync("data/plano-com-textos.json") ? "data/plano-com-textos.json" : "data/plano-365-dias.json");
const { dias } = JSON.parse(fs.readFileSync(arquivo, "utf8"));
// lotes menores, porque cada dia com texto bíblico pesa algumas dezenas de KB
for (let i = 0; i < dias.length; i += 50) {
  const b = db.batch();
  dias.slice(i, i + 50).forEach((d) => b.set(db.doc(`dias/${d.numero}`), d, { merge: true }));
  await b.commit();
  console.log(`…${Math.min(i + 50, dias.length)} dias`);
}
console.log(`Importados ${dias.length} dias de ${arquivo}.`);
