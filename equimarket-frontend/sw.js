// EquiMarket Service Worker
const CACHE_NAME = 'equimarket-v1';
const STATIC_CACHE_NAME = 'equimarket-static-v1';
const DYNAMIC_CACHE_NAME = 'equimarket-dynamic-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/homepage_v2.html',
    '/ilanlar.html',
    '/login.html',
    '/register.html',
    '/css/main.css',
    '/css/style.css',
    '/js/config.js',
    '/js/auth.js',
    '/js/toast.js',
    '/images/logo.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                // Cache assets that exist, don't fail on missing ones
                return Promise.allSettled(
                    STATIC_ASSETS.map(asset =>
                        cache.add(asset).catch(err =>
                            console.log(`[Service Worker] Failed to cache: ${asset}`)
                        )
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API requests (don't cache)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Return offline response for API calls
                    return new Response(
                        JSON.stringify({ error: 'Çevrimdışı moddasınız' }),
                        {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // Skip external URLs
    if (url.origin !== location.origin) {
        return;
    }

    // Cache-first strategy for static assets
    if (isStaticAsset(url.pathname)) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetchAndCache(request, STATIC_CACHE_NAME);
                })
        );
        return;
    }

    // Network-first strategy for HTML pages
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone and cache the response
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                    .then((cache) => cache.put(request, responseClone));
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline page for HTML requests
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Helper function to check if URL is a static asset
function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Helper function to fetch and cache
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[Service Worker] Fetch failed:', error);
        throw error;
    }
}

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    let data = {
        title: 'EquiMarket',
        body: 'Yeni bir bildiriminiz var',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/icon-72x72.png'
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: data.actions || [
            { action: 'open', title: 'Aç' },
            { action: 'close', title: 'Kapat' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window/tab open
                for (const client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if needed
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    } else if (event.tag === 'sync-favorites') {
        event.waitUntil(syncFavorites());
    }
});

// Sync pending messages when back online
async function syncMessages() {
    try {
        const pendingMessages = await getPendingFromIndexedDB('pending-messages');
        for (const message of pendingMessages) {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
            await removeFromIndexedDB('pending-messages', message.id);
        }
    } catch (error) {
        console.error('[Service Worker] Sync messages failed:', error);
    }
}

// Sync pending favorites when back online
async function syncFavorites() {
    try {
        const pendingFavorites = await getPendingFromIndexedDB('pending-favorites');
        for (const favorite of pendingFavorites) {
            await fetch(`/api/favorites/${favorite.horseId}`, {
                method: favorite.action,
                headers: { 'Content-Type': 'application/json' }
            });
            await removeFromIndexedDB('pending-favorites', favorite.id);
        }
    } catch (error) {
        console.error('[Service Worker] Sync favorites failed:', error);
    }
}

// IndexedDB helpers for offline sync
function getPendingFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('equimarket-offline', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
                resolve([]);
                return;
            }
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAll = store.getAll();
            getAll.onsuccess = () => resolve(getAll.result);
            getAll.onerror = () => reject(getAll.error);
        };
    });
}

function removeFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('equimarket-offline', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

console.log('[Service Worker] Loaded');
