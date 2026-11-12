import admin from "firebase-admin";
import fs from "fs";
const cred = JSON.parse(fs.readFileSync(process.env.SERVICE_ACCOUNT || "service-account.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(cred) });
const db = admin.firestore();
const { dias } = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (let i = 0; i < dias.length; i += 400) {
  const b = db.batch();
  dias.slice(i, i + 400).forEach((d) => b.set(db.doc(`dias/${d.numero}`), d, { merge: true }));
  await b.commit();
}
console.log(`Importados ${dias.length} dias.`);
