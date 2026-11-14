# Sendas Sagradas: Plano de Leitura da Bíblia

Next.js 14 + Firebase (Auth/Firestore) + Gemini + n8n. Deploy na Vercel.

- Texto bíblico de cada dia (Bíblia Livre, licença aberta)
- Estudo aprofundado do dia gerado com Gemini (salvo e compartilhado entre usuários)
- Mural da comunidade em tempo real
- Lembrete diário por e-mail via n8n

**Guia completo de configuração: [docs/PASSO-A-PASSO.md](docs/PASSO-A-PASSO.md)**

Resumo:
1. `npm install` e copie `.env.example` para `.env.local` (preencha).
2. Publique `firestore.rules` no Firestore.
3. (Opcional, recomendado) `npm run textos` e depois `npm run importar`.
4. `npm run dev`. Na Vercel, cadastre as mesmas variáveis do `.env.local`.
5. Importe `n8n/lembrete-diario.json` no n8n.
