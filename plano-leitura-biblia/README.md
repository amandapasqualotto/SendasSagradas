# Plano de Leitura da Bíblia
1. `npm install`  2. Copie `.env.example` para `.env.local` e preencha com as chaves do Firebase.
3. Cole `firestore.rules` na aba Regras do Firestore.
4. Importar o plano: baixe a chave de serviço (Firebase > Configurações > Contas de serviço), salve como `service-account.json` (NÃO suba ao Git) e rode `npm run importar`.
5. `npm run dev`. Deploy: importe o repositório na Vercel e cadastre as 4 variáveis NEXT_PUBLIC_*.
Obs.: reimportar o plano sobrescreve o campo `capitulos` dos dias.
