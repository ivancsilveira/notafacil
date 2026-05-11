// NotaFácil Service Worker — v1.0.5
// Permite o app funcionar offline (visualizar documentos já enviados)
// e acelera o carregamento.

const CACHE_NAME = 'notafacil-v1.0.5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

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

// Fetch: "network first" — sempre tenta a internet primeiro,
// se falhar (sem conexão), usa o cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Não interceptar chamadas pra Firebase/Claude/Google (precisam ser sempre online)
  const url = req.url;
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebaseio.com') ||
    url.includes('firebasestorage') ||
    url.includes('googleapis.com') ||
    url.includes('callclaude') ||
    url.includes('accounts.google.com') ||
    url.includes('gstatic.com')
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
