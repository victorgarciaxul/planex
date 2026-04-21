/* ============================================================
   PlaNex – Mapa interactivo (Leaflet + OpenStreetMap)
   Córdoba, España · Ubicaciones placeholder
   ============================================================ */

const CORDOBA = [37.8882, -4.7794];

const LOCATIONS = [
  {
    id: 1,
    name: 'Centro Cultural Lorem Ipsum',
    desc: 'Espacio cultural con accesibilidad verificada para todos los públicos.',
    level: 'sello',
    lat: 37.8901, lng: -4.7801,
    icons: ['Movilidad', 'Visual', 'LSE'],
  },
  {
    id: 2,
    name: 'Museo Ipsum Córdoba',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    level: 'base',
    lat: 37.8845, lng: -4.7738,
    icons: ['Movilidad', 'Sonidos'],
  },
  {
    id: 3,
    name: 'Polideportivo Lorem',
    desc: 'Instalaciones deportivas adaptadas con protocolo PlaNex Nivel Base.',
    level: 'base',
    lat: 37.8955, lng: -4.7889,
    icons: ['Movilidad', 'Cognitiva'],
  },
  {
    id: 4,
    name: 'Teatro Adipiscing',
    desc: 'Teatro con bucle magnético, subtitulado y plazas reservadas.',
    level: 'sello',
    lat: 37.8836, lng: -4.7792,
    icons: ['LSE', 'Visual', 'Sonidos', 'Movilidad'],
  },
  {
    id: 5,
    name: 'Biblioteca Lorem Elit',
    desc: 'Fondo en formatos accesibles y sala de lectura fácil.',
    level: 'sello',
    lat: 37.8870, lng: -4.7850,
    icons: ['Cognitiva', 'Visual', 'Movilidad'],
  },
];

/* ── Iconos de marcador personalizados ── */
function createIcon(level) {
  const color = level === 'sello' ? '#2D7A4F' : '#0F5C8A';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11 14 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z"
        fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

/* ── Contenido popup ── */
function popupHTML(loc) {
  const levelLabel = loc.level === 'sello' ? 'Sello PlaNex' : 'Nivel Base';
  const levelClass = `popup-level--${loc.level}`;
  const iconsList   = loc.icons.map(i => `<span>${i}</span>`).join(' · ');
  return `
    <div>
      <div class="popup-level ${levelClass}">● ${levelLabel}</div>
      <p class="popup-title">${loc.name}</p>
      <p class="popup-desc">${loc.desc}</p>
      <p class="popup-desc" style="margin-top:.4rem;color:#6B7280">${iconsList}</p>
    </div>`;
}

/* ── Inicializar mapa ── */
document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const map = L.map('map', {
    center: CORDOBA,
    zoom: 14,
    zoomControl: true,
    scrollWheelZoom: false,
  });

  /* Tiles OpenStreetMap */
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  /* Markers */
  const markers = [];
  LOCATIONS.forEach(loc => {
    const marker = L.marker([loc.lat, loc.lng], {
      icon: createIcon(loc.level),
      alt: loc.name,
      title: loc.name,
    })
      .bindPopup(popupHTML(loc), { maxWidth: 260 })
      .addTo(map);

    marker._planexLevel = loc.level;
    markers.push(marker);
  });

  /* Activar scroll al hacer clic en el mapa */
  mapEl.addEventListener('click', () => { map.scrollWheelZoom.enable(); });
  mapEl.addEventListener('mouseleave', () => { map.scrollWheelZoom.disable(); });

  /* Filtros */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('filter-btn--active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('filter-btn--active');
      btn.setAttribute('aria-pressed', 'true');

      markers.forEach(m => {
        if (filter === 'all' || m._planexLevel === filter) {
          m.addTo(map);
        } else {
          m.remove();
        }
      });
    });
  });
});
