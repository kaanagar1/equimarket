// EquiMarket Leaflet Map Integration
(function() {
    'use strict';

    // Türkiye şehirleri koordinatları
    const turkishCities = {
        'adana': [36.9914, 35.3308],
        'adıyaman': [37.7644, 38.2786],
        'afyonkarahisar': [38.7507, 30.5567],
        'ağrı': [39.7191, 43.0503],
        'aksaray': [38.3687, 34.0370],
        'amasya': [40.6499, 35.8353],
        'ankara': [39.9334, 32.8597],
        'antalya': [36.8969, 30.7133],
        'ardahan': [41.1105, 42.7022],
        'artvin': [41.1828, 41.8183],
        'aydın': [37.8560, 27.8416],
        'balıkesir': [39.6484, 27.8826],
        'bartın': [41.6344, 32.3375],
        'batman': [37.8812, 41.1351],
        'bayburt': [40.2552, 40.2249],
        'bilecik': [40.0567, 30.0665],
        'bingöl': [38.8855, 40.4966],
        'bitlis': [38.4006, 42.1095],
        'bolu': [40.7354, 31.6061],
        'burdur': [37.4613, 30.0665],
        'bursa': [40.1828, 29.0665],
        'çanakkale': [40.1553, 26.4142],
        'çankırı': [40.6013, 33.6134],
        'çorum': [40.5506, 34.9556],
        'denizli': [37.7765, 29.0864],
        'diyarbakır': [37.9144, 40.2306],
        'düzce': [40.8438, 31.1565],
        'edirne': [41.6818, 26.5623],
        'elazığ': [38.6810, 39.2264],
        'erzincan': [39.7500, 39.5000],
        'erzurum': [39.9000, 41.2700],
        'eskişehir': [39.7767, 30.5206],
        'gaziantep': [37.0662, 37.3833],
        'giresun': [40.9128, 38.3895],
        'gümüşhane': [40.4386, 39.5086],
        'hakkari': [37.5744, 43.7408],
        'hatay': [36.4018, 36.3498],
        'ığdır': [39.9237, 44.0450],
        'ısparta': [37.7648, 30.5566],
        'istanbul': [41.0082, 28.9784],
        'izmir': [38.4237, 27.1428],
        'kahramanmaraş': [37.5858, 36.9371],
        'karabük': [41.2061, 32.6204],
        'karaman': [37.1759, 33.2287],
        'kars': [40.6167, 43.1000],
        'kastamonu': [41.3887, 33.7827],
        'kayseri': [38.7312, 35.4787],
        'kırıkkale': [39.8468, 33.5153],
        'kırklareli': [41.7333, 27.2167],
        'kırşehir': [39.1425, 34.1709],
        'kilis': [36.7184, 37.1212],
        'kocaeli': [40.8533, 29.8815],
        'konya': [37.8746, 32.4932],
        'kütahya': [39.4167, 29.9833],
        'malatya': [38.3552, 38.3095],
        'manisa': [38.6191, 27.4289],
        'mardin': [37.3212, 40.7245],
        'mersin': [36.8000, 34.6333],
        'muğla': [37.2153, 28.3636],
        'muş': [38.9462, 41.7539],
        'nevşehir': [38.6939, 34.6857],
        'niğde': [37.9667, 34.6833],
        'ordu': [40.9839, 37.8764],
        'osmaniye': [37.0743, 36.2478],
        'rize': [41.0201, 40.5234],
        'sakarya': [40.6940, 30.4358],
        'samsun': [41.2928, 36.3313],
        'siirt': [37.9333, 41.9500],
        'sinop': [42.0231, 35.1531],
        'sivas': [39.7477, 37.0179],
        'şanlıurfa': [37.1591, 38.7969],
        'şırnak': [37.5164, 42.4611],
        'tekirdağ': [40.9833, 27.5167],
        'tokat': [40.3167, 36.5500],
        'trabzon': [41.0015, 39.7178],
        'tunceli': [39.1079, 39.5401],
        'uşak': [38.6823, 29.4082],
        'van': [38.4891, 43.4089],
        'yalova': [40.6500, 29.2667],
        'yozgat': [39.8181, 34.8147],
        'zonguldak': [41.4564, 31.7987]
    };

    // Default Turkey bounds
    const turkeyBounds = [[35.8, 26.0], [42.5, 45.0]];
    const turkeyCenter = [39.0, 35.0];

    // Map instances storage
    const mapInstances = {};

    // Create a map instance
    const createMap = (containerId, options = {}) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Map container #${containerId} not found`);
            return null;
        }

        // Default options
        const defaultOptions = {
            center: options.center || turkeyCenter,
            zoom: options.zoom || 6,
            minZoom: 5,
            maxZoom: 18,
            maxBounds: turkeyBounds,
            maxBoundsViscosity: 1.0
        };

        const map = L.map(containerId, { ...defaultOptions, ...options });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        mapInstances[containerId] = map;
        return map;
    };

    // Create a marker
    const createMarker = (map, lat, lng, options = {}) => {
        const markerOptions = {
            ...options
        };

        // Custom horse icon
        if (options.horseIcon) {
            markerOptions.icon = L.divIcon({
                html: `<div class="horse-marker" style="background:${options.color || '#1a3d2e'};color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🐎</div>`,
                className: 'horse-marker-icon',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36]
            });
        }

        const marker = L.marker([lat, lng], markerOptions).addTo(map);

        if (options.popup) {
            marker.bindPopup(options.popup);
        }

        if (options.tooltip) {
            marker.bindTooltip(options.tooltip);
        }

        return marker;
    };

    // Get coordinates for a Turkish city
    const getCityCoordinates = (cityName) => {
        if (!cityName) return null;

        // Normalize city name
        const normalized = cityName
            .toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .trim();

        // Try direct match first
        if (turkishCities[normalized]) {
            return turkishCities[normalized];
        }

        // Try partial match
        for (const [city, coords] of Object.entries(turkishCities)) {
            const cityNormalized = city
                .replace(/ı/g, 'i')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c');

            if (cityNormalized.includes(normalized) || normalized.includes(cityNormalized)) {
                return coords;
            }
        }

        return null;
    };

    // Create a map showing multiple horse locations
    const createListingsMap = (containerId, listings) => {
        const map = createMap(containerId, { zoom: 6 });
        if (!map) return null;

        const markers = [];
        const markerGroup = L.featureGroup();

        listings.forEach(listing => {
            const city = listing.location?.city;
            const coords = getCityCoordinates(city);

            if (coords) {
                // Add slight random offset to prevent overlapping
                const lat = coords[0] + (Math.random() - 0.5) * 0.1;
                const lng = coords[1] + (Math.random() - 0.5) * 0.1;

                const popupContent = `
                    <div style="min-width:200px">
                        <strong style="font-size:14px">${listing.name}</strong><br>
                        <span style="color:#666">${listing.breedDisplay || listing.breed}</span><br>
                        <span style="color:#1a3d2e;font-weight:600">₺${listing.price?.toLocaleString('tr-TR') || 'Belirtilmemiş'}</span><br>
                        <a href="horse_detail.html?id=${listing._id}" style="color:#c9a55c">Detayları Gör →</a>
                    </div>
                `;

                const marker = createMarker(map, lat, lng, {
                    horseIcon: true,
                    popup: popupContent,
                    tooltip: listing.name
                });

                markerGroup.addLayer(marker);
                markers.push(marker);
            }
        });

        if (markers.length > 0) {
            markerGroup.addTo(map);
            map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
        }

        return { map, markers, markerGroup };
    };

    // Create a single location map
    const createLocationMap = (containerId, cityName, options = {}) => {
        const coords = getCityCoordinates(cityName);
        if (!coords) {
            console.warn(`Coordinates not found for city: ${cityName}`);
            return null;
        }

        const map = createMap(containerId, {
            center: coords,
            zoom: options.zoom || 10
        });

        if (!map) return null;

        const marker = createMarker(map, coords[0], coords[1], {
            horseIcon: true,
            popup: options.popup || `<strong>${cityName}</strong>`,
            color: options.color
        });

        return { map, marker, coords };
    };

    // Destroy a map instance
    const destroyMap = (containerId) => {
        if (mapInstances[containerId]) {
            mapInstances[containerId].remove();
            delete mapInstances[containerId];
        }
    };

    // Refresh map size (useful when container visibility changes)
    const refreshMap = (containerId) => {
        if (mapInstances[containerId]) {
            mapInstances[containerId].invalidateSize();
        }
    };

    // Check if Leaflet is loaded
    const isLeafletLoaded = () => typeof L !== 'undefined';

    // Load Leaflet dynamically if not loaded
    const ensureLeafletLoaded = () => {
        return new Promise((resolve, reject) => {
            if (isLeafletLoaded()) {
                resolve();
                return;
            }

            // Load CSS
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(css);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Expose API globally
    window.EquiMarketMap = {
        createMap,
        createMarker,
        createListingsMap,
        createLocationMap,
        getCityCoordinates,
        destroyMap,
        refreshMap,
        ensureLeafletLoaded,
        isLeafletLoaded,
        turkishCities
    };
})();
