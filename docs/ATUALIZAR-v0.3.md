# Atualizar para a v0.3

O que tem de novo:

- **Página inicial (sumário):** plano, Bíblia, mural, destaques e sugeridos
- **Bíblia em ordem:** AT e NT, livro, capítulo, com "Estudar este capítulo"
- **Visão geral do plano:** os 365 dias por mês, com busca por livro
- **Dia do plano em seções recolhíveis:** Visão geral, cada leitura com o seu estudo, Oração e reflexões, Anotações
- **Grifos** (4 cores) e a página **Meus destaques**
- **Significado de palavra:** selecione uma palavra e toque em "Significado"
- **Ouvir a leitura** com a voz do navegador, versículo por versículo, com velocidade ajustável
- **Estudos usando os seus PDFs** como material de apoio
- **Conta:** nome e lembrete agora ficam em uma página própria

Não há variáveis novas na Vercel.

---

## 1. Atualizar a pasta no seu computador

1. Extraia o zip da v0.3.
2. Copie **todo o conteúdo** da pasta `plano-leitura-biblia` extraída para dentro da sua pasta `plano-leitura-biblia` (a que tem o `.env.local`). Quando o Windows perguntar, escolha **Substituir os arquivos no destino**.
   - O `.env.local`, o `service-account.json` e o `node_modules` continuam lá, porque o zip não traz esses arquivos.
3. Apague estes dois arquivos antigos, que não são mais usados:
   - `components/Relatorio.js`
   - a pasta `app/api/relatorio`
4. Coloque o arquivo **`fontes-sendas.json.gz`** (enviado separado) dentro da pasta `data`.

## 2. Instalar e importar os materiais de apoio

No PowerShell, dentro da pasta `plano-leitura-biblia`:
```
npm.cmd install
npm.cmd run importar-fontes
```
O segundo comando envia os materiais dos PDFs ao Firestore e leva alguns minutos. Espere aparecer `Pronto: ... documentos de fontes importados.`

## 3. Regras do Firestore

Firebase Console → Firestore Database → **Regras** → apague tudo, cole o conteúdo novo do arquivo `firestore.rules` → **Publicar**.
(Sem isso, os estudos e os significados não aparecem na tela.)

## 4. Testar

```
npm.cmd run dev
```
Abra http://localhost:3000 e confira:
- a página inicial com os cartões e os sugeridos;
- **Bíblia** → Gênesis → 1: o texto, o botão **Ouvir** e o **Estudar este capítulo**;
- toque em dois versículos → escolha uma cor → abra **Destaques**;
- dê um duplo clique numa palavra → **Significado de "..."**;
- um dia do plano: abra as seções e gere o estudo de uma leitura.

## 5. Subir para o GitHub

1. No GitHub, entre em `plano-leitura-biblia` → **Add file → Upload files**.
2. Arraste o conteúdo da sua pasta local, **menos**:
   - `node_modules`, `.next`, `.env.local`, `service-account.json`
   - o arquivo `data/fontes-sendas.json.gz`. Ele já está no Firestore, e o repositório pode ficar público.
3. **Commit changes**.
4. Apague no GitHub os antigos `components/Relatorio.js` e `app/api/relatorio/route.js` (abra o arquivo → ⋯ → **Delete file**).
5. Confira se o arquivo `.gitignore` está na pasta `plano-leitura-biblia` do GitHub. Se não estiver, suba-o também. No Windows ele aparece normalmente; se não aparecer, ative **Exibir → Itens ocultos** no Explorador.

## Como editar os sugeridos

Arquivo `lib/sugeridos.js`. Copie um bloco `{ ... }`, troque nome, descrição, link e tipo (`youtube`, `instagram`, `podcast`, `site` ou `livro`) e suba o arquivo.

## Observações

- Os estudos agora são salvos na coleção `estudos`. Os antigos (`relatorios`) não são mais exibidos e podem ser apagados no console.
- O grifo marca o versículo inteiro. Para grifar vários, toque em todos e escolha a cor uma vez.
- No celular, o **toque longo** numa palavra seleciona a palavra e mostra o botão de significado.
- A qualidade da voz depende do aparelho. No Chrome, Android e Windows costuma ser boa.
