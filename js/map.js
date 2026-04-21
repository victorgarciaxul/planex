/* ============================================================
   PlaNex – Mapa interactivo (Leaflet + OpenStreetMap)
   Zona: Centro histórico de Córdoba – Medina & Axerquía
   ============================================================ */

/* Centro del mapa: Plaza de las Tendillas (corazón de la Medina) */
const CORDOBA_CENTER = [37.8794, -4.7826];
const ZOOM_INICIAL   = 15;

/* Ubicaciones placeholder — sustituir por espacios reales verificados */
const LOCATIONS = [
  {
    id: 1,
    name: 'Mezquita-Catedral de Córdoba',
    desc: 'Monumento accesible con itinerario adaptado, audioguía y servicio de atención especializada.',
    level: 'sello',
    lat: 37.8791, lng: -4.7797,
    icons: ['Movilidad', 'Visual', 'Cognitiva'],
  },
  {
    id: 2,
    name: 'Alcázar de los Reyes Cristianos',
    desc: 'Jardines y salas con acceso adaptado y señalética inclusiva.',
    level: 'sello',
    lat: 37.8766, lng: -4.7864,
    icons: ['Movilidad', 'Visual', 'LSE'],
  },
  {
    id: 3,
    name: 'Plaza de la Corredera',
    desc: 'Espacio público sin barreras arquitectónicas con servicios accesibles.',
    level: 'base',
    lat: 37.8815, lng: -4.7769,
    icons: ['Movilidad'],
  },
  {
    id: 4,
    name: 'Palacio de Viana',
    desc: 'Visitas con itinerario adaptado y material en lectura fácil disponible.',
    level: 'base',
    lat: 37.8870, lng: -4.7731,
    icons: ['Movilidad', 'Cognitiva'],
  },
  {
    id: 5,
    name: 'Teatro Góngora',
    desc: 'Sala con bucle magnético, subtitulado y plazas reservadas para PMR.',
    level: 'sello',
    lat: 37.8836, lng: -4.7792,
    icons: ['LSE', 'Sonidos', 'Movilidad', 'Visual'],
  },
];

/* ── Icono de marcador PlaNex ── */
function createIcon(level) {
  const isPurple = level === 'sello';
  const fill     = isPurple ? '#7048E8' : '#0F5C8A';
  const ring     = isPurple ? '#C4B5FD' : '#BAD7F2';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,.35)"/>
    </filter>
    <path d="M18 0C8.06 0 0 8.06 0 18c0 12.42 16 30 18 30s18-17.58 18-30C36 8.06 27.94 0 18 0z"
      fill="${fill}" filter="url(#shadow)"/>
    <circle cx="18" cy="18" r="9" fill="white" opacity=".95"/>
    <circle cx="18" cy="18" r="5" fill="${fill}"/>
    <circle cx="18" cy="18" r="8" fill="none" stroke="${ring}" stroke-width="1.5"/>
  </svg>`;

  return L.divIcon({
    className:   '',
    html:        svg,
    iconSize:    [36, 48],
    iconAnchor:  [18, 48],
    popupAnchor: [0, -52],
  });
}

/* ── HTML del popup ── */
function popupHTML(loc) {
  const isS  = loc.level === 'sello';
  const label = isS ? '★ Sello PlaNex' : '● Nivel Base';
  const cls   = isS ? 'popup-level--sello' : 'popup-level--base';
  const tags  = loc.icons
    .map(i => `<span class="popup-tag">${i}</span>`)
    .join('');
  return `
    <div class="popup-inner">
      <span class="popup-level ${cls}">${label}</span>
      <p class="popup-title">${loc.name}</p>
      <p class="popup-desc">${loc.desc}</p>
      <div class="popup-tags">${tags}</div>
    </div>`;
}

/* ── Inicialización robusta ── */
function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') {
    /* Si Leaflet aún no está disponible, reintentamos en 200ms */
    setTimeout(initMap, 200);
    return;
  }

  /* Evitar doble inicialización */
  if (mapEl._leaflet_id) return;

  const map = L.map('map', {
    center:          CORDOBA_CENTER,
    zoom:            ZOOM_INICIAL,
    zoomControl:     false,      /* reubicamos el control abajo a la izquierda */
    scrollWheelZoom: false,
    tap:             false,      /* evita bugs en iOS con touch */
  });

  /* Control de zoom en esquina inferior izquierda */
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  /* Tiles – CartoDB Positron (más limpio que OSM estándar y HTTPS nativo) */
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/">CARTO</a>',
      subdomains:  'abcd',
      maxZoom:     19,
    }
  ).addTo(map);

  /* Marcadores */
  const allMarkers = [];
  LOCATIONS.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], {
      icon:  createIcon(loc.level),
      alt:   loc.name,
      title: loc.name,
    })
      .bindPopup(popupHTML(loc), {
        maxWidth:    280,
        className:   'planex-popup',
        closeButton: true,
      })
      .addTo(map);

    marker._planexLevel = loc.level;
    allMarkers.push(marker);
  });

  /* Activar scroll-zoom al interactuar con el mapa */
  mapEl.addEventListener('click',      () => map.scrollWheelZoom.enable());
  mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

  /* Filtros de nivel */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('filter-btn--active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('filter-btn--active');
      btn.setAttribute('aria-pressed', 'true');

      allMarkers.forEach(m => {
        if (filter === 'all' || m._planexLevel === filter) {
          m.addTo(map);
        } else {
          map.removeLayer(m);
        }
      });
    });
  });

  /*
    invalidateSize resuelve el problema de renderizado cuando el
    contenedor tiene zoom CSS aplicado (widget de accesibilidad).
    Lo llamamos varias veces para garantizar que los tiles carguen.
  */
  map.invalidateSize();
  setTimeout(() => map.invalidateSize(), 100);
  setTimeout(() => map.invalidateSize(), 400);

  /* ResizeObserver — si el contenedor cambia de tamaño (responsive, zoom) */
  if (window.ResizeObserver) {
    new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
  }
}

/*
  Arranque: usamos 'load' (todos los recursos cargados) en lugar de
  DOMContentLoaded para garantizar que Leaflet CDN esté disponible.
  Si DOMContentLoaded ya ha ocurrido, ejecutamos inmediatamente.
*/
if (document.readyState === 'complete') {
  initMap();
} else {
  window.addEventListener('load', initMap);
}
