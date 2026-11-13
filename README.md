<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:C98B94,100:7A2E3A&height=220&section=header&text=Sendas%20Sagradas%20❦&fontSize=46&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Guided%20Bible%20reading%20%C3%97%20Generative%20AI%20%C3%97%20Community&descAlignY=58&descSize=18" width="100%" alt="banner"/>

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=3500&pause=900&color=7A2E3A&center=true&vCenter=true&width=750&lines=365-day+Bible+reading+plan;AI-powered+daily+study+with+Gemini;Real-time+community+wall;Daily+e-mail+reminders+with+Make" alt="Typing SVG" />
</a>

<br/><br/>

### <a href="#english">🇺🇸 English</a> &nbsp;|&nbsp; <a href="#portugues">🇧🇷 Português</a>

<br/>

<a href="https://sendassagradas.vercel.app"><img src="https://img.shields.io/badge/Live%20demo-sendassagradas.vercel.app-7A2E3A?style=for-the-badge&logo=vercel&logoColor=white"/></a>
![Version](https://img.shields.io/badge/version-0.2.0-B08D57?style=for-the-badge)
![Status](https://img.shields.io/badge/status-online-C98B94?style=for-the-badge)

</div>

<br/>

<!-- ======================================================== -->
<!-- ======================= ENGLISH ======================== -->
<!-- ======================================================== -->

<a id="english"></a>

# 🇺🇸 English

## 📖 About the project

> *"A daily path through the Scriptures: read, understand and share."*

**Sendas Sagradas** ("Sacred Paths") is a web app for a **guided one-year Bible reading plan**. Each day brings three readings (Old Testament, Psalms/Proverbs and New Testament), the full biblical text, a **study generated with Generative AI** and a **community wall** where readers share verses, words and prayer requests.

The goal is to turn daily reading into a **real moment of study**, with historical context, authorship, peoples, geography and connections across the Bible, all in one place.

<br/>

## ✨ Features

| | Feature | How it works |
|:---:|---|---|
| 📅 | **365-day plan** | Progress tracking, a day grid and personal notes for each day |
| 📜 | **Biblical text for every day** | *Bíblia Livre* (open license), imported into Firestore, with an API fallback |
| 🧠 | **In-depth daily study** | Gemini returns **structured JSON**: historical context, authorship and date, characters, peoples, geography, cross-references, key verse, glossary, applications, reflection questions and a prayer |
| 💾 | **Smart AI caching** | Each day's study is generated **once** and shared by all users (at most 365 calls a year) |
| 💬 | **Community wall** | Real-time posts (verse, word, prayer request, testimony), 🙏 "Amen" reactions, filters and moderation |
| 🔔 | **Daily reminder** | Make runs every day at 9 p.m. and e-mails only the readers who **haven't read yet** that day |
| 🔐 | **Security** | Firestore Security Rules validate each post, protect user data and keep secret keys on the server |

<br/>

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### 💻 Front-end
<img src="https://img.shields.io/badge/Next.js%2014-7A2E3A?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React-B08D57?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-C98B94?style=for-the-badge&logo=javascript&logoColor=white"/>
<img src="https://img.shields.io/badge/CSS3-4A3426?style=for-the-badge&logo=css3&logoColor=white"/>

</td>
<td width="50%" valign="top">

### ☁️ Back-end & Data
<img src="https://img.shields.io/badge/Firebase%20Auth-7A2E3A?style=for-the-badge&logo=firebase&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloud%20Firestore-B08D57?style=for-the-badge&logo=firebase&logoColor=white"/>
<img src="https://img.shields.io/badge/API%20Routes-C98B94?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Firebase%20Admin-4A3426?style=for-the-badge&logo=firebase&logoColor=white"/>

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🤖 AI
<img src="https://img.shields.io/badge/Google%20Gemini-7A2E3A?style=for-the-badge&logo=googlegemini&logoColor=white"/>
<img src="https://img.shields.io/badge/Structured%20Output-B08D57?style=for-the-badge&logoColor=white"/>
<img src="https://img.shields.io/badge/Prompt%20Engineering-C98B94?style=for-the-badge&logoColor=white"/>

</td>
<td width="50%" valign="top">

### 🚀 Deploy & Automation
<img src="https://img.shields.io/badge/Vercel-7A2E3A?style=for-the-badge&logo=vercel&logoColor=white"/>
<img src="https://img.shields.io/badge/GitHub-B08D57?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/Make-C98B94?style=for-the-badge&logo=make&logoColor=white"/>
<img src="https://img.shields.io/badge/Gmail-4A3426?style=for-the-badge&logo=gmail&logoColor=white"/>

</td>
</tr>
</table>

<br/>

## 🧭 Architecture

```mermaid
flowchart LR
    U["Reader"] --> APP["Next.js app<br/>on Vercel"]
    APP <--> AUTH["Firebase Auth"]
    APP <--> FS[("Cloud Firestore<br/>days, studies, wall, users")]
    APP -->|"/api/relatorio"| GEM["Google Gemini"]
    GEM -->|"structured JSON"| FS
    APP -->|"/api/biblia (fallback)"| BIB["Free Use Bible API"]
    MAKE["Make<br/>daily at 9 p.m."] -->|"/api/lembretes"| APP
    MAKE --> MAIL["Gmail"]
```

<br/>

## 🧠 What I learned

| Concept | In this project |
|---|---|
| 🎯 **Prompt Engineering** | A prompt that asks for historical care and signals tradition vs. hypothesis |
| 🧩 **Structured Output** | A JSON schema so the AI response always renders correctly |
| 💾 **Caching / cost control** | Store AI results in Firestore and reuse them for every user |
| 🔐 **Security Rules** | Validate post content and limit each user to their own data |
| 🔑 **Secret management** | API keys only on the server, through environment variables |
| ⚙️ **Workflow automation** | A scheduled no-code scenario calling a protected endpoint |
| ⚖️ **Licensing & LGPD** | An open-license Bible translation with attribution, plus opt-in for e-mail reminders |

<br/>

<div align="center">

<a href="#portugues">🇧🇷 Ler em Português</a> &nbsp;|&nbsp; <a href="#english">⬆️ Back to top</a>

</div>

<br/>

---

<br/>

<!-- ======================================================== -->
<!-- ====================== PORTUGUÊS ======================= -->
<!-- ======================================================== -->

<a id="portugues"></a>

# 🇧🇷 Português

## 📖 Sobre o projeto

> *"Um caminho diário pelas Escrituras: ler, entender e compartilhar."*

O **Sendas Sagradas** é um app web de **leitura bíblica guiada em um ano**. Cada dia traz três leituras (Antigo Testamento, Salmos/Provérbios e Novo Testamento), o texto bíblico completo, um **estudo gerado com IA Generativa** e um **mural da comunidade**, onde os leitores compartilham versículos, palavras e pedidos de oração.

O objetivo é transformar a leitura diária em um **momento real de estudo**, com contexto histórico, autoria, povos, geografia e conexões com o resto da Bíblia, tudo em um só lugar.

<br/>

## ✨ Funcionalidades

| | Funcionalidade | Como funciona |
|:---:|---|---|
| 📅 | **Plano de 365 dias** | Acompanhamento do progresso, grade de dias e anotações pessoais em cada dia |
| 📜 | **Texto bíblico em cada dia** | *Bíblia Livre* (licença aberta), importada para o Firestore, com uma API como plano B |
| 🧠 | **Estudo aprofundado do dia** | O Gemini devolve um **JSON estruturado**: contexto histórico, autoria e data, personagens, povos, geografia, conexões bíblicas, versículo-chave, glossário, aplicações, perguntas para reflexão e uma oração |
| 💾 | **Cache inteligente da IA** | O estudo de cada dia é gerado **uma única vez** e compartilhado entre todos (no máximo 365 chamadas por ano) |
| 💬 | **Mural da comunidade** | Posts em tempo real (versículo, palavra, pedido de oração, testemunho), reações 🙏 "Amém", filtros e moderação |
| 🔔 | **Lembrete diário** | O Make roda todo dia às 21h e envia e-mail só para quem **ainda não leu** naquele dia |
| 🔐 | **Segurança** | As Security Rules do Firestore validam cada post, protegem os dados dos usuários e as chaves secretas ficam só no servidor |

<br/>

## 🛠️ Tecnologias

<table>
<tr>
<td width="50%" valign="top">

### 💻 Front-end
<img src="https://img.shields.io/badge/Next.js%2014-7A2E3A?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React-B08D57?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-C98B94?style=for-the-badge&logo=javascript&logoColor=white"/>
<img src="https://img.shields.io/badge/CSS3-4A3426?style=for-the-badge&logo=css3&logoColor=white"/>

</td>
<td width="50%" valign="top">

### ☁️ Back-end e Dados
<img src="https://img.shields.io/badge/Firebase%20Auth-7A2E3A?style=for-the-badge&logo=firebase&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloud%20Firestore-B08D57?style=for-the-badge&logo=firebase&logoColor=white"/>
<img src="https://img.shields.io/badge/API%20Routes-C98B94?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Firebase%20Admin-4A3426?style=for-the-badge&logo=firebase&logoColor=white"/>

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🤖 IA
<img src="https://img.shields.io/badge/Google%20Gemini-7A2E3A?style=for-the-badge&logo=googlegemini&logoColor=white"/>
<img src="https://img.shields.io/badge/Sa%C3%ADda%20Estruturada-B08D57?style=for-the-badge&logoColor=white"/>
<img src="https://img.shields.io/badge/Prompt%20Engineering-C98B94?style=for-the-badge&logoColor=white"/>

</td>
<td width="50%" valign="top">

### 🚀 Deploy e Automação
<img src="https://img.shields.io/badge/Vercel-7A2E3A?style=for-the-badge&logo=vercel&logoColor=white"/>
<img src="https://img.shields.io/badge/GitHub-B08D57?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/Make-C98B94?style=for-the-badge&logo=make&logoColor=white"/>
<img src="https://img.shields.io/badge/Gmail-4A3426?style=for-the-badge&logo=gmail&logoColor=white"/>

</td>
</tr>
</table>

<br/>

## 🧭 Arquitetura

```mermaid
flowchart LR
    U["Leitor"] --> APP["App Next.js<br/>na Vercel"]
    APP <--> AUTH["Firebase Auth"]
    APP <--> FS[("Cloud Firestore<br/>dias, estudos, mural, usuários")]
    APP -->|"/api/relatorio"| GEM["Google Gemini"]
    GEM -->|"JSON estruturado"| FS
    APP -->|"/api/biblia (plano B)"| BIB["Free Use Bible API"]
    MAKE["Make<br/>todo dia às 21h"] -->|"/api/lembretes"| APP
    MAKE --> MAIL["Gmail"]
```

<br/>

## 🧠 O que aprendi

| Conceito | Neste projeto |
|---|---|
| 🎯 **Prompt Engineering** | Prompt que pede cuidado histórico e diferencia tradição de hipótese |
| 🧩 **Saída estruturada** | Um schema JSON para a resposta da IA sempre aparecer certinha na tela |
| 💾 **Cache e controle de custo** | Guardar o resultado da IA no Firestore e reaproveitar para todos os usuários |
| 🔐 **Security Rules** | Validar o conteúdo dos posts e limitar cada usuário aos próprios dados |
| 🔑 **Gestão de segredos** | Chaves de API só no servidor, por variáveis de ambiente |
| ⚙️ **Automação de workflows** | Cenário no-code agendado chamando um endpoint protegido |
| ⚖️ **Licenças e LGPD** | Tradução bíblica de licença aberta com atribuição, e lembrete por e-mail só com opt-in |

<br/>


## 📜 Créditos

Texto bíblico: **Bíblia Livre (BLIVRE)** © Diego Santos, Mario Sérgio e Marco Teles, licença Creative Commons Atribuição. Fornecido pela [Free Use Bible API](https://bible.helloao.org).

<br/>

## 👩‍💻 Autora

<div align="center">

Feito com 💖 por **Amanda Pasqualotto**

<a href="https://www.linkedin.com/in/amanda-pasqualotto-b14ab6327/"><img src="https://img.shields.io/badge/LinkedIn-7A2E3A?style=for-the-badge&logo=linkedin&logoColor=white"/></a>
<a href="https://github.com/amandapasqualotto"><img src="https://img.shields.io/badge/GitHub-B08D57?style=for-the-badge&logo=github&logoColor=white"/></a>
<a href="https://sendassagradas.vercel.app"><img src="https://img.shields.io/badge/Ver%20o%20app-C98B94?style=for-the-badge&logo=vercel&logoColor=white"/></a>

<br/><br/>

<a href="#english">🇺🇸 Read in English</a> &nbsp;|&nbsp; <a href="#portugues">⬆️ Voltar ao topo</a>

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7A2E3A,100:C98B94&height=120&section=footer" width="100%" alt="footer"/>
