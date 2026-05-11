# NotaFácil — Documentação do Projeto

> Sistema web de organização automática de notas fiscais, recibos, boletos e garantias com IA (Claude) e Firebase.

**Versão atual:** v1.0.25
**Última atualização:** 11/05/2026
**Construído por:** Ivan Silveira (com assistência do Claude da Anthropic)

---

## 📋 O que é o NotaFácil

App web (PWA — Progressive Web App) que recebe foto ou PDF de qualquer documento financeiro e:

1. 🧠 **Classifica automaticamente** com Claude (nota fiscal, recibo, boleto, outros)
2. 📊 **Extrai os dados principais** (loja, valor, data, garantia sugerida pelo CDC)
3. 📁 **Organiza em pastas** automaticamente por tipo
4. 🛡️ **Gerencia garantias** com cores semáforo (verde/amarelo/vermelho conforme proximidade do vencimento)
5. 📅 **Adiciona ao Google Agenda** lembrete 30 dias antes da garantia vencer
6. 📷 **Funciona pela câmera** no celular ou upload de arquivos no desktop

---

## 🏗️ Arquitetura

```
┌─────────────────────┐
│  Navegador (PWA)    │  ← HTML + JS puro hospedado no GitHub Pages
│  index.html         │
└──────────┬──────────┘
           │
           ├──→ Firebase Auth (login Google)
           ├──→ Firebase Firestore (dados dos documentos)
           ├──→ Firebase Storage (fotos/PDFs)
           │
           └──→ Cloud Function "callClaude"  ← Proxy seguro
                       │
                       └──→ API da Anthropic (Claude)
                            (chave protegida como Secret no servidor)
```

**Por que esse desenho:**
- A chave do Claude **NUNCA** fica no navegador (proteção contra roubo)
- A Cloud Function age como "porteiro" e usa CORS pra liberar só os domínios autorizados
- Cada usuário só vê seus próprios documentos (isolamento por `userId` no Firestore)

---

## 🌐 URLs e Recursos

| Recurso | URL / Identificador |
|---------|---------------------|
| **App em produção** | https://ivancsilveira.github.io/notafacil/ |
| **Repositório GitHub** | https://github.com/ivancsilveira/notafacil |
| **Console Firebase** | https://console.firebase.google.com/project/notafacil-99434 |
| **Console Google Cloud** | https://console.cloud.google.com/?project=notafacil-99434 |
| **Cloud Function URL** | https://callclaude-zy3i2tea5q-uc.a.run.app |
| **Projeto Firebase ID** | notafacil-99434 |
| **Conta dona do Firebase** | ody1900@gmail.com |
| **Plano Firebase** | Blaze (pay-as-you-go) com limite de R$ 6/mês |

---

## 🔐 Configuração Firebase (já feita)

### Serviços ativos no projeto `notafacil-99434`:

- ✅ **Authentication** — Provider: Google
  - Domínios autorizados: `ivancsilveira.github.io`, `localhost`
- ✅ **Firestore Database** — region: `southamerica-east1`
- ✅ **Storage** — region: `us-east1` (sem custo financeiro)
- ✅ **Cloud Functions** — region: `us-central1`
- ✅ **Secret Manager** — secret: `CLAUDE_API_KEY`

### Config do Firebase no `index.html`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDKPT6PanR75OwX_aICmbhzr08ct3sz9uc",
  authDomain: "notafacil-99434.firebaseapp.com",
  projectId: "notafacil-99434",
  storageBucket: "notafacil-99434.firebasestorage.app",
  messagingSenderId: "117443301099",
  appId: "1:117443301099:web:110cae60706be406cfb8ae"
};
```

⚠️ **Esta config é PÚBLICA por design** — não é segredo. A segurança vem das regras do Firestore + Storage (autenticação obrigatória).

---

## 🤖 Cloud Function — `callClaude`

### Localização do código no computador do Ivan:
```
/Users/ivan/notafacil-server/functions/index.js
```

### O que faz:
1. Recebe POST do navegador com `{ messages, model, max_tokens, tools }`
2. Adiciona cabeçalhos CORS pra liberar `https://ivancsilveira.github.io`
3. Pega a `CLAUDE_API_KEY` do Secret Manager
4. Faz proxy para `https://api.anthropic.com/v1/messages`
5. Devolve a resposta da Anthropic pro navegador

### Configurações importantes:
- **Region:** `us-central1`
- **Memory:** 512 MiB
- **Timeout:** 120 segundos
- **Autenticação:** Pública (permite invocações não autenticadas) — protegido por CORS
- **Secrets vinculados:** `CLAUDE_API_KEY`

### Modelo usado:
```
claude-sonnet-4-5-20250929
```

### Como fazer redeploy (do Terminal):
```bash
cd ~/notafacil-server
firebase deploy --only functions
```

---

## 📱 PWA — Instalável como App

A partir da **v1.0.5**, o NotaFácil pode ser instalado como app no celular e desktop:

### Arquivos PWA necessários (no GitHub Pages):
- `manifest.json` — metadata do app (nome, ícones, cores)
- `service-worker.js` — cache offline e atualização automática
- `icon-192.png` — ícone 192×192
- `icon-512.png` — ícone 512×512

### Como instalar:
- **Android (Chrome):** botão flutuante "📲 Instalar app" aparece automaticamente
- **iPhone (Safari):** botão Compartilhar → "Adicionar à Tela de Início"
- **Mac (Chrome):** ícone de instalação na barra de endereço

---

## 📂 Estrutura de arquivos do projeto

### No GitHub (https://github.com/ivancsilveira/notafacil)
```
notafacil/
├── index.html           ← App completo (HTML + CSS + JS em um arquivo só)
├── manifest.json        ← Configuração do PWA
├── service-worker.js    ← Cache offline
├── icon-192.png         ← Ícone do app
├── icon-512.png         ← Ícone do app (alta resolução)
└── CLAUDE.md            ← Este arquivo (documentação)
```

### No computador local do Ivan (servidor Cloud Function):
```
~/notafacil-server/
├── firebase.json
├── .firebaserc
└── functions/
    ├── index.js         ← Código da Cloud Function
    ├── package.json
    └── node_modules/
```

---

## 🚨 Regras de Versionamento (IMPORTANTE)

**Toda mudança no `index.html` DEVE bumpar a versão** em 4 lugares:

1. Badge da tela de login (linha ~427)
2. Badge do header principal (linha ~437)
3. Título "NotaFácil v1.0.X" na tela "Sobre" (linha ~563)
4. Texto "Build: ... (v1.0.X - descrição)" na tela "Sobre" (linha ~566)

Se mudar o `service-worker.js`, atualizar também a constante `CACHE_NAME` pra forçar refresh do cache.

---

## 🐛 Bugs Resolvidos (Histórico)

| Versão | O que arrumou |
|--------|---------------|
| v1.0.0 | Versão inicial |
| v1.0.1 | Conversão automática de imagens HEIC/HEIF pra JPEG (problema do iPhone) |
| v1.0.2 | Versão visível em tudo, botão "Forçar atualização" |
| v1.0.3 | Detecção robusta de PDF via magic bytes (`%PDF-`) |
| v1.0.4 | Servidor Cloud Function (CORS resolvido, chave Claude protegida no servidor) |
| v1.0.5 | PWA instalável (manifest, service worker, ícones) |
| v1.0.6 | Busca, zoom na foto (lightbox), pastas personalizadas, login melhorado (sempre pede escolha de conta) |
| v1.0.7 | Web Share Target: recebe arquivos compartilhados de outros apps (WhatsApp, Fotos, etc) no Android |
| v1.0.8 | Zoom estilo app Fotos (ancorado no ponto que pinça), Calendário Apple (.ics) detectado automaticamente em iPhone/iPad/Mac |
| v1.0.9 | Criar pasta personalizada direto do modal de "Revisar documento" quando Claude não identificar o tipo |
| v1.0.10 | Extrai chave de acesso da NF-e/NFC-e (44 dígitos) + botão "Mover" pra reorganizar documentos entre pastas |
| v1.0.11 | Dias de aviso da garantia configuráveis (Ajustes + por agendamento), validação visual da chave de acesso (44 dígitos), prompt mais rigoroso pro Claude |
| v1.0.12 | Linha digitável de boleto (47-48 dígitos), botão "Agendar pagamento" cria evento no calendário no dia do vencimento às 10h com a linha digitável no corpo do evento |
| v1.0.13 | Processamento em lote: selecionar vários arquivos/fotos de uma vez, revisar cada um em sequência, botão "Pular este" |
| v1.0.14 | 🧠 **Pastas inteligentes**: descreve o tipo de documento e Claude extrai campos específicos. Suporte a QR Code PIX em boletos, PDFs com várias páginas (max_tokens 4096), correção do bug de mover documento (recarrega Firestore), edição de pastas customizadas |
| v1.0.15 | Correção do zoom: fundo do lightbox agora é preto sólido (antes era 95% opaco, mostrando o conteúdo da tela atrás como sobreposição estranha) |
| v1.0.16 | Correção definitiva do zoom: esconder modal de detalhes (visibility:hidden) durante o lightbox e restaurar depois. Resolve bug de z-index do iOS Safari onde textos do modal apareciam por cima da foto zoomada |
| v1.0.17 | Botão "☁️ Importar da nuvem" sem accept restritivo, força o iOS a mostrar Google Drive, OneDrive, Dropbox, iCloud no seletor de arquivos nativo |
| v1.0.18 | Dias de aviso de boleto configuráveis (Ajustes + por agendamento). Modal "Agendar pagamento" permite escolher 0/1/2/3/5/7 dias antes ou valor customizado. Padrão: 0 dias (no dia do vencimento). PIX QR Code também incluído no corpo do evento |
| v1.0.19 | **Correção do zoom em PDFs**: PDFs agora não tentam abrir no lightbox (que é só pra imagens). Em vez disso, mostram um card laranja "Toque para abrir em tela cheia" que abre o PDF no Safari/visualizador nativo do iOS, com zoom próprio do PDF |
| v1.0.20 | Re-analisar documento já cadastrado com instrução atual da pasta (🔄), editar campos extras já extraídos (✏️). **Bug do QR Code PIX corrigido**: PIX agora é guardado em data-attribute base64, resolvendo problema com caracteres especiais no onclick HTML |
| v1.0.21 | **Bug do PIX inválido (rejeitado pelo banco) — resolvido**: prompt do Claude muito mais conservador (retorna null se houver QUALQUER incerteza letra por letra, em vez de chutar e gerar código inválido). Novo campo `tem_qrcode` (boolean) + botão "📱 Mostrar QR Code em tela cheia" — abre o boleto pra usuário escanear com câmera do app do banco (modo mais confiável de pagar) |
| v1.0.22 | 🎯 **Decodificação REAL de QR Code com jsQR**: adicionada biblioteca jsQR (~50KB, código aberto) carregada via CDN. Boletos com QR Code agora têm o PIX **decodificado direto da imagem** (não mais "chutado" pelo Claude). Novo botão **"📱 Escanear QR Code"** na tela inicial — abre câmera ao vivo, lê QR Code, cria boleto automaticamente com valor e recebedor extraídos do BR Code. Solução profissional: zero chance de PIX inválido |
| v1.0.23 | **Layout dos campos extras corrigido**: valores longos (URLs, códigos PIX BR Code, linhas digitáveis) não vazam mais da tela. Detecção automática de "valor longo" (>30 chars ou URL ou código sem espaços) com layout vertical empilhado e fonte monoespaçada pra códigos. CSS global das detail-rows reforçado com `word-break:break-word` e `overflow-wrap:anywhere` |
| v1.0.24 | **Datas em formato brasileiro**: campos extras com data ISO (YYYY-MM-DD) agora são exibidos como DD/MM/AAAA automaticamente. Função `formatValueSmart()` detecta data ISO e converte. Função inversa `parseValueSmart()` converte DD/MM/AAAA de volta pra ISO quando o usuário edita e salva. Aplicado nos 3 modais (novo doc, re-análise, edição) e no detalhe |
| v1.0.25 | **Modal de ajuda pra importar da nuvem**: o iOS Safari não mostra providers de nuvem em PWAs (limitação da Apple). Substituído o botão "Importar da nuvem" por "Como importar do Drive / OneDrive / iCloud" que abre modal com instruções passo a passo: (1) configurar providers no app Arquivos, (2) atalho via Compartilhar, (3) botão "tentar abrir app Arquivos" via esquema URL `shareddocuments://` |

---

## 💰 Custos Estimados

- **GitHub Pages:** Grátis
- **Firebase Auth:** Grátis até 50k logins/mês
- **Firestore:** Grátis até 50k leituras/dia
- **Storage:** Grátis até 5GB
- **Cloud Functions:** Grátis até 2M invocações/mês
- **API Claude:** ~R$ 0,05 a R$ 0,15 por documento processado

**Limite de gastos configurado:** R$ 6/mês no Cloud Billing (proteção contra surpresas)

---

## 🛡️ Segurança

✅ **Boas práticas implementadas:**
- Chave da Claude **NUNCA** sai do servidor (armazenada em Secret Manager)
- CORS configurado pra aceitar SÓ `https://ivancsilveira.github.io`
- Cada usuário só acessa seus próprios documentos (Firestore Rules por `userId`)
- Login obrigatório via Google (Firebase Auth)
- HTTPS em todos os endpoints

---

## 🎯 Próximas Melhorias Possíveis

Ideias caso queira evoluir o app:

- [ ] Busca/filtro nas pastas (por loja, valor, data)
- [ ] Notificações push quando garantia tá perto de vencer
- [ ] Compartilhar nota fiscal por link (uma URL temporária)
- [ ] Exportar tudo pra Excel/CSV
- [ ] Dashboard com gráficos de gastos por categoria/mês
- [ ] OCR de QR Code de NFC-e brasileira (consulta SEFAZ)
- [ ] Reconhecer múltiplos itens numa nota (não só o total)
- [ ] Suporte multi-usuário com dashboard compartilhado (família)

---

## 📞 Contatos & Acessos

- **Dono do projeto:** Ivan Silveira (`ivancsilveira` no GitHub)
- **Firebase / Cloud Function:** conta `ody1900@gmail.com`
- **GitHub:** conta `ivancsilveira`
- **Crédito Claude API:** USD 20 comprados em ody1900@gmail.com (Anthropic Console)

---

## 🆘 Troubleshooting

### "Failed to fetch" no console do navegador
- ⚠️ Cloud Function pode ter ficado privada de novo. Vai em https://console.cloud.google.com/run → callclaude → Segurança → "Permitir acesso público"

### "Não consigo fazer login"
- ⚠️ Pode ser o domínio não autorizado. Firebase Console → Authentication → Settings → Authorized domains. Deve ter `ivancsilveira.github.io`

### "PDF gigante não funciona"
- ⚠️ A API do Claude tem limite de ~100 páginas de PDF. Use só os primeiros 50 MB.

### "App não atualiza no celular"
- ⚠️ Service Worker cacheia. Vai em Ajustes → "🔄 Forçar atualização" no app.

### Como aumentar limite de gastos
- Cloud Billing Console → Orçamentos → editar limite mensal

---

*Documento gerado em 10/05/2026 — durante a construção do NotaFácil com o Claude (Anthropic).*
