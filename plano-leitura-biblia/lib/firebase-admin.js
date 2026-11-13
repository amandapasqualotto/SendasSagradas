// Firebase Admin — usado SOMENTE no servidor (rotas /api). Nunca importe em componentes "use client".
// Na Vercel, cadastre FIREBASE_SERVICE_ACCOUNT_BASE64 = conteúdo do service-account.json em base64.
import admin from "firebase-admin";

function credencial() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const json = b64 ? Buffer.from(b64, "base64").toString("utf8") : process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) throw new Error("Defina FIREBASE_SERVICE_ACCOUNT_BASE64 nas variáveis de ambiente.");
  return admin.credential.cert(JSON.parse(json));
}

export function getAdmin() {
  if (!admin.apps.length) admin.initializeApp({ credential: credencial() });
  return { db: admin.firestore(), auth: admin.auth(), FieldValue: admin.firestore.FieldValue };
}

// Valida o token do usuário logado enviado no header Authorization: Bearer <token>
export async function usuarioDaRequisicao(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token) return null;
  try { return await getAdmin().auth.verifyIdToken(token); } catch { return null; }
}
