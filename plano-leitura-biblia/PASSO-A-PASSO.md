# Sendas Sagradas v0.2: passo a passo

O que muda nesta versão:

| Recurso | Como funciona |
|---|---|
| **Texto bíblico em cada dia** | Bíblia Livre (BLIVRE, licença aberta CC BY) vinda da *Free Use Bible API* (bible.helloao.org). Funciona na hora pela rota `/api/biblia`, e você pode gravar tudo no Firestore com `npm run textos` + `npm run importar` para ficar mais rápido. |
| **Estudo aprofundado do dia** | Botão "Gerar estudo do dia". O servidor chama o Gemini, recebe um JSON estruturado (contexto, autoria, povos, geografia, conexões, mensagem, glossário, aplicações, oração) e salva em `relatorios/{dia}`. O estudo é gerado **uma vez por dia do plano** e fica disponível para todo mundo. |
| **Mural da comunidade** | `/mural`, em tempo real: versículos, palavras, pedidos de oração e testemunhos, com botão 🙏 "Amém"/"Estou orando", filtros e opção de apagar. Cada leitura do dia tem um botão "Compartilhar no mural". |
| **Lembrete diário (n8n)** | Na página inicial a pessoa ativa o lembrete e escolhe o horário. O n8n chama `/api/lembretes` a cada hora e envia e-mail pelo Gmail só para quem ainda não leu no dia. |

Arquivos novos ou alterados:

```
app/page.js                 (home: não baixa mais a coleção "dias" inteira; card de lembrete + nome)
app/dia/[n]/page.js         (texto bíblico, estudo, compartilhar, grava diaAtual/ultimaLeitura)
app/mural/page.js           (novo)
app/api/biblia/route.js     (novo) busca texto bíblico na internet, com cache na CDN
app/api/relatorio/route.js  (novo) Gemini + cache no Firestore
app/api/lembretes/route.js  (novo) lista para o n8n
components/Relatorio.js, components/Nav.js (novos)
lib/biblia.mjs              (novo) mapa de livros + cliente da API bíblica
lib/firebase-admin.js       (novo) Admin SDK (só servidor)
scripts/baixar-textos.mjs   (novo)   scripts/importar.mjs (ajustado)
firestore.rules             (novas regras)
n8n/lembrete-diario.json    (workflow para importar no n8n)
next.config.mjs, package.json, .env.example, .gitignore, app/globals.css
```

---

## Etapa 1: Colocar o código no repositório

1. No seu computador, entre na pasta do repositório e crie um branch:
   ```bash
   git checkout -b v2-estudo-mural
   ```
2. Substitua o conteúdo da pasta `plano-leitura-biblia/` pelo conteúdo deste pacote. **Não apague** o seu `.env.local` nem o `service-account.json`.
3. Apague o `package-lock.json` antigo da pasta `plano-leitura-biblia/` e instale:
   ```bash
   cd plano-leitura-biblia
   npm install
   ```
   (O `package-lock.json` vazio que está na **raiz** do repositório pode ser apagado; ele não é usado.)

## Etapa 2: Chave de serviço do Firebase para o servidor

As rotas novas (`/api/relatorio` e `/api/lembretes`) gravam e leem o Firestore com permissão de administrador. Por isso precisam da mesma chave de serviço que você já usa no `npm run importar`.

1. Se ainda não tiver: Firebase Console → ⚙️ Configurações do projeto → **Contas de serviço** → *Gerar nova chave privada* → salve como `service-account.json` dentro de `plano-leitura-biblia/`.
2. Converta para base64 (uma linha só):
   - **Windows (PowerShell):**
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | Set-Clipboard`
   - **Mac:** `base64 -i service-account.json | pbcopy`
   - **Linux:** `base64 -w0 service-account.json`
3. O resultado (já copiado) é o valor de `FIREBASE_SERVICE_ACCOUNT_BASE64`.

> ⚠️ Essa chave dá acesso total ao banco. Ela só vai em variável de ambiente, **sem** o prefixo `NEXT_PUBLIC_`, e nunca no Git (o `.gitignore` já bloqueia o arquivo).

## Etapa 3: Chave do Gemini

1. Acesse **https://aistudio.google.com/apikey** com sua conta Google → *Create API key* (pode ser no mesmo projeto do Firebase).
2. Guarde a chave: ela é o `GEMINI_API_KEY`.
3. O modelo padrão é `gemini-2.5-flash`. Para usar um Flash mais novo, defina `GEMINI_MODEL` com o nome exato que aparece em https://ai.google.dev/gemini-api/docs/models.

Custo: cada dia do plano é gerado uma única vez e depois fica salvo, então o ano inteiro dá no máximo 365 chamadas. Isso cabe no nível gratuito.

## Etapa 4: Variáveis de ambiente

Crie/atualize o `.env.local` (para rodar no seu computador) e cadastre as **mesmas** variáveis na Vercel: *Project → Settings → Environment Variables* (Production, Preview e Development).

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (4) | já existem, não mexa |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | o base64 da etapa 2 |
| `GEMINI_API_KEY` | a chave da etapa 3 |
| `LEMBRETES_SECRET` | uma senha longa inventada por você (ex.: gere em https://1password.com/password-generator) |
| `LEMBRETES_TZ` | `America/Campo_Grande` (ou `America/Sao_Paulo` se o público for SP) |
| `APP_URL` | `https://sendassagradas.vercel.app` |
| `GEMINI_MODEL` | opcional |

## Etapa 5: Regras do Firestore

Firebase Console → Firestore Database → **Regras** → cole o conteúdo de `firestore.rules` → **Publicar**.

O que as regras garantem:
- `dias` e `relatorios`: qualquer usuário logado lê, ninguém grava pelo app (só o servidor/script).
- `usuarios/{uid}`: só o dono lê e grava, e o e-mail salvo tem que ser o da própria conta. Assim ninguém cadastra o e-mail de outra pessoa para receber lembretes.
- `mural`: todos leem; cada post é validado (tipo, até 1000 caracteres, autor = quem está logado); no "Amém" cada pessoa só mexe no próprio voto; só o autor (ou um admin) apaga.

## Etapa 6: Texto bíblico

**Sem fazer nada**, o app já mostra o texto: quando o dia não tem texto no Firestore, a página chama `/api/biblia`, que busca na internet e guarda em cache.

**Recomendado** (deixa a leitura instantânea e independente da API externa):
```bash
npm run textos -- --teste    # baixa só o Dia 1 e mostra uma prévia; confira se está em português
npm run textos               # baixa as 1.095 leituras (alguns minutos) -> data/plano-com-textos.json
npm run importar             # envia para o Firestore (usa o arquivo com textos automaticamente)
```
- Para ver as traduções em português disponíveis: `npm run textos -- --listar`. Para trocar, defina `BIBLIA_TRADUCAO=<id>` antes do comando e também na Vercel.
- Por que Bíblia Livre e não ARA/NVI/NAA? Essas versões têm direitos autorais e não podem ser republicadas num app sem licença. A BLIVRE é uma atualização da Almeida com licença aberta, e o app já exibe o crédito exigido.
- O arquivo `data/plano-com-textos.json` está no `.gitignore`, porque é grande e pode ser gerado de novo quando quiser.

## Etapa 7: Testar no seu computador

```bash
npm run dev
```
Abra http://localhost:3000 e confira:
1. **Home:** carrega rápido, aparece o card "Lembrete diário"; preencha seu nome.
2. **Dia 1:** o texto aparece com número dos versículos → clique **Gerar estudo do dia** → em ~30 s o estudo aparece (abra em outro navegador: ele já vem pronto).
3. **Compartilhar no mural** num dos capítulos → publique → clique 🙏.
4. **Concluir dia** → no Firestore, `usuarios/{seu uid}` deve ter `diaAtual: 2` e `ultimaLeitura`.

## Etapa 8: Virar administradora do mural

Firestore → *Iniciar coleção* `admins` → ID do documento = **seu UID** (Authentication → Users, coluna "UID do usuário") → um campo qualquer, ex.: `ativo: true`. Admins podem apagar qualquer post.

## Etapa 9: Deploy

```bash
git add .
git commit -m "v0.2: texto bíblico, estudo com Gemini, mural e lembretes"
git push -u origin v2-estudo-mural
```
A Vercel cria um *Preview* desse branch. Teste nele e, se estiver tudo certo, faça o merge no `main` (PR no GitHub) para ir para produção.
Na Vercel, confirme que **Root Directory** = `plano-leitura-biblia`.

## Etapa 10: Lembretes com n8n

1. **Tenha um n8n:** n8n Cloud (https://n8n.io, tem teste grátis) ou self-hosted (Docker, Railway, Render etc.).
2. **Importe o workflow:** *Workflows → ⋯ → Import from File* → `n8n/lembrete-diario.json`. São 4 nós:
   `A cada hora` → `Buscar quem lembrar` (GET `/api/lembretes`) → `Um item por pessoa` (Split Out) → `Enviar e-mail` (Gmail).
3. **Nó "Buscar quem lembrar":** troque o valor do header `x-lembrete-secret` pelo seu `LEMBRETES_SECRET`.
   (Mais seguro: crie uma credencial *Header Auth* com esse nome/valor e selecione em Authentication.)
4. **Nó "Enviar e-mail":** em *Credential*, conecte sua conta Gmail (OAuth). Para um remetente "oficial", crie um Gmail só do app.
5. **Teste:** no nó HTTP, mude temporariamente a URL para `.../api/lembretes?todos=1` e clique *Execute workflow*. Você (com lembrete ativado no app) deve receber o e-mail. Depois **volte a URL** ao normal.
6. **Ative** o workflow (chave *Active*).

Como a rota decide quem recebe: lembrete ativado + `horaLembrete` igual à hora atual (no fuso `LEMBRETES_TZ`) + ainda não concluiu nenhum dia hoje.

> Limite do Gmail comum: ~500 e-mails/dia. Se a comunidade crescer, troque o último nó por SMTP do Brevo/Resend, ou por Telegram/WhatsApp (o JSON da rota já traz `email`, `nome`, `dia`, `leituras`, `link`).

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "Não foi possível gerar o estudo agora" | `GEMINI_API_KEY` ausente/errada, ou `FIREBASE_SERVICE_ACCOUNT_BASE64` errado. Veja *Vercel → Logs* da função `/api/relatorio`. |
| Estudo travado em "Preparando…" | Uma geração falhou no meio. Após 2 min o botão libera de novo; ou apague `relatorios/{dia}` no console. |
| Quer refazer o estudo de um dia | Apague o documento `relatorios/{dia}` no Firestore e clique em gerar de novo. |
| Mural: "Não foi possível publicar" | Regras novas não publicadas (etapa 5). |
| Texto bíblico não aparece | Rode `npm run textos -- --teste` para ver o erro; a API pode ter mudado o ID da tradução (use `--listar` e `BIBLIA_TRADUCAO`). |
| n8n recebe 401 | O header `x-lembrete-secret` não é igual ao `LEMBRETES_SECRET` da Vercel (refaça o deploy depois de cadastrar a variável). |

## Ideias para as próximas versões

- Denunciar post no mural + moderação automática com Gemini antes de publicar.
- Notificações push (Firebase Cloud Messaging) além do e-mail.
- Grupos/igrejas: mural separado por grupo, ranking de constância.
- Áudio do texto do dia (Gemini TTS).
