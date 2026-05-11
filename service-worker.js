// NotaFácil Service Worker — v1.0.19
// Permite o app funcionar offline (visualizar documentos já enviados)
// e acelera o carregamento.
// Inclui Web Share Target: receber fotos/PDFs compartilhados do Android.

const CACHE_NAME = 'notafacil-v1.0.19';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Armazena temporariamente arquivos compartilhados pra repassar pro app
let pendingSharedFiles = [];

// Instalação: baixa os arquivos e guarda no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Receber arquivos compartilhados de outros apps (Android)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ---- WEB SHARE TARGET: intercepta o POST que outros apps mandam ----
  if (req.method === 'POST' && url.pathname.endsWith('/') && url.pathname.includes('notafacil')) {
    event.respondWith((async () => {
      try {
        const formData = await req.formData();
        const files = formData.getAll('shared_files');
        if (files.length > 0) {
          pendingSharedFiles = files;
        }
      } catch (e) {
        console.warn('Share target error:', e);
      }
      // Redireciona pra home, que vai pegar o arquivo armazenado
      return Response.redirect('./?shared=1', 303);
    })());
    return;
  }

  // Cliente perguntando se tem arquivo compartilhado pendente
  if (url.searchParams.has('check-shared')) {
    event.respondWith((async () => {
      const files = pendingSharedFiles;
      pendingSharedFiles = []; // consome (limpa)
      // Não dá pra mandar File diretamente; criamos um Blob URL temporário
      // Em vez disso, deixamos o app pegar via message (postMessage)
      return new Response(JSON.stringify({ count: files.length }), {
        headers: { 'Content-Type': 'application/json' }
      });
    })());
    return;
  }

  // Não interceptar chamadas pra Firebase/Claude/Google (precisam ser sempre online)
  const urlStr = req.url;
  if (
    urlStr.includes('firestore.googleapis.com') ||
    urlStr.includes('firebaseio.com') ||
    urlStr.includes('firebasestorage') ||
    urlStr.includes('googleapis.com') ||
    urlStr.includes('callclaude') ||
    urlStr.includes('accounts.google.com') ||
    urlStr.includes('gstatic.com')
  ) {
    return; // deixa o navegador lidar normalmente
  }

  // Só faz cache de GET
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        // Atualiza o cache com a versão nova
        const respClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, respClone).catch(() => {});
        });
        return response;
      })
      .catch(() => caches.match(req))
  );
});

// Recebe mensagem do app pedindo os arquivos compartilhados
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SHARED_FILES') {
    const files = pendingSharedFiles;
    pendingSharedFiles = []; // consome
    event.ports[0].postMessage({ files });
  }
});
