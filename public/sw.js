// Service Worker for offline functionality
const CACHE_NAME = 'railway-inspection-v1';
const STATIC_CACHE_NAME = 'railway-inspection-static-v1';

// Resources to cache for offline use
const STATIC_RESOURCES = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/src/pages/inspection-form.tsx',
  '/src/pages/cmi-dashboard.tsx',
  '/src/components/catering-form.tsx',
  '/src/components/enhanced-smart-search.tsx',
  '/src/data/stations.ts',
  '/src/data/shortlisted-items.ts'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/shortlisted-items',
  '/api/stations',
  '/api/auth/user'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_RESOURCES);
      }),
      caches.open(CACHE_NAME).then((cache) => {
        // Pre-cache essential API endpoints
        return Promise.allSettled(
          API_ENDPOINTS.map(endpoint => 
            fetch(endpoint).then(response => {
              if (response.ok) {
                cache.put(endpoint, response.clone());
              }
              return response;
            }).catch(() => {
              // Ignore errors during pre-caching
            })
          )
        );
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static resources
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // For GET requests, try network first, fallback to cache
  if (request.method === 'GET') {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      console.log('Network failed, trying cache:', url.pathname);
    }
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for essential endpoints
    if (url.pathname === '/api/shortlisted-items' || url.pathname.includes('/api/shortlisted-items/search')) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // For POST/PUT/DELETE requests, store for background sync if offline
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    try {
      return await fetch(request);
    } catch (error) {
      // Store request for background sync
      await storeOfflineRequest(request);
      
      // Return success response to prevent UI errors
      return new Response(JSON.stringify({ 
        id: 'offline-' + Date.now(),
        status: 'queued',
        message: 'Request saved for sync when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Fallback to network
  return fetch(request);
}

// Handle static resources with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    throw error;
  }
}

// Store offline requests for background sync
async function storeOfflineRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  // Store in IndexedDB for persistence
  const db = await openOfflineDB();
  const transaction = db.transaction(['requests'], 'readwrite');
  const store = transaction.objectStore('requests');
  await store.add(requestData);
}

// Open IndexedDB for offline storage
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('railway-inspection-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('requests')) {
        const requestStore = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
        requestStore.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('inspections')) {
        const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
        inspectionStore.createIndex('status', 'status');
      }
    };
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    const requests = await store.getAll();
    
    console.log(`Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove synced request
          await store.delete(requestData.id);
          console.log('Synced request:', requestData.url);
        }
      } catch (error) {
        console.log('Failed to sync request:', requestData.url, error);
      }
    }
    
    // Notify clients about sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          syncedCount: requests.length
        });
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Serve static files from public directory
app.use(express.static('public'));