/* ============================================================
   PlaNex – JS principal
   · Widget de accesibilidad (WCAG 2.1 AA)
   · Navegación móvil
   · Scroll activo en nav
   · Formulario de contacto
   · Animaciones de entrada
   ============================================================ */

'use strict';

/* ── Helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   Widget de accesibilidad
   Aplica cambios directamente al DOM para evitar problemas
   con referencias circulares en CSS custom properties.
   ============================================================ */
const A11Y_KEY = 'planex_a11y';

const a11yDefaults = {
  scale:    '100',   // zoom de página: 90 | 100 | 115 | 130
  font:     '16',    // font-size raíz en px: 13 | 16 | 19 | 22
  contrast: 'normal',// normal | high | gray | saturate
  line:     '1.65',  // line-height: 1.65 | 2 | 2.4
};

/* Mapas de valores a estilos reales */
const CONTRAST_FILTERS = {
  normal:   '',
  high:     'contrast(1.6) brightness(1.05)',
  gray:     'grayscale(1)',
  saturate: 'saturate(2.5)',
};

function applyA11ySettings(s) {
  const html = document.documentElement;

  /* 1. Escala de página (zoom) ─ solo aplicar si no es el 100% por defecto
        zoom:100% crea un stacking context que rompe cálculos de Leaflet */
  html.style.zoom = s.scale === '100' ? '' : `${s.scale}%`;

  /* 2. Tamaño de letra ─ modifica font-size raíz en px (sin unidades circulares) */
  html.style.fontSize = `${s.font}px`;

  /* 3. Contraste / color ─ CSS filter sobre el html */
  /*    Excluimos el propio panel para que siempre sea legible */
  html.style.filter = CONTRAST_FILTERS[s.contrast] ?? '';
  html.dataset.contrast = s.contrast; /* para CSS adicionales */

  /* 4. Interlineado ─ custom property directa */
  html.style.setProperty('--lh-base', s.line);
}

function saveA11ySettings(s) {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(s)); } catch {}
}

function loadA11ySettings() {
  try {
    const raw = localStorage.getItem(A11Y_KEY);
    return raw ? { ...a11yDefaults, ...JSON.parse(raw) } : { ...a11yDefaults };
  } catch {
    return { ...a11yDefaults };
  }
}

function syncA11yButtons(s) {
  $$('[data-action]').forEach(btn => {
    const isActive = s[btn.dataset.action] === btn.dataset.value;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.classList.toggle('a11y-btn--active', isActive);
  });
}

function initA11yWidget() {
  const toggle   = $('#a11yToggle');
  const panel    = $('#a11yPanel');
  const closeBtn = $('#a11yClose');
  const resetBtn = $('#a11yReset');
  if (!toggle || !panel) return;

  let settings = loadA11ySettings();
  applyA11ySettings(settings);
  syncA11yButtons(settings);

  /* ── Abrir / cerrar panel ── */
  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    /* pequeño delay para que el foco funcione después del display */
    requestAnimationFrame(() => closeBtn?.focus());
  };
  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden ? openPanel() : closePanel();
  });

  closeBtn?.addEventListener('click', closePanel);

  /* Escape cierra panel */
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
  });

  /* Clic fuera cierra panel */
  document.addEventListener('click', e => {
    if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) {
      closePanel();
    }
  });

  /* ── Botones de ajuste ── */
  $$('[data-action]', panel).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      settings = { ...settings, [btn.dataset.action]: btn.dataset.value };
      applyA11ySettings(settings);
      saveA11ySettings(settings);
      syncA11yButtons(settings);
    });
  });

  /* ── Restablecer ── */
  resetBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    settings = { ...a11yDefaults };
    applyA11ySettings(settings);
    saveA11ySettings(settings);
    syncA11yButtons(settings);
  });
}

/* ============================================================
   Navegación móvil
   ============================================================ */
function initNav() {
  const toggle = $('#navToggle');
  const menu   = $('#navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* Cerrar al hacer clic en un enlace */
  $$('.nav__link', menu).forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* Cerrar con Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

/* ============================================================
   Scroll – header sombra + enlace activo
   ============================================================ */
function initScrollEffects() {
  const header  = $('.site-header');
  const sections = $$('section[id]');
  const navLinks = $$('.nav__link[href^="#"]');

  function onScroll() {
    /* Sombra en header */
    header?.classList.toggle('scrolled', window.scrollY > 20);

    /* Enlace activo */
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   Formulario de contacto
   ============================================================ */
function initContactForm() {
  const form         = $('#contactForm');
  const tipoSelect   = $('#tipo');
  const reporteGroup = $('#reporteGroup');
  const successMsg   = $('#formSuccess');
  if (!form) return;

  /* Mostrar campo extra al seleccionar "reporte" */
  tipoSelect?.addEventListener('change', () => {
    const isReporte = tipoSelect.value === 'reporte';
    reporteGroup.hidden = !isReporte;
    if (isReporte) reporteGroup.querySelector('input')?.focus();
  });

  /* Envío */
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    try {
      const data = new FormData(form);
      const res  = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.reset();
        reporteGroup.hidden = true;
        successMsg.hidden = false;
        successMsg.focus();
      } else {
        alert('Ha ocurrido un error. Por favor, inténtalo de nuevo o contáctanos directamente.');
      }
    } catch {
      alert('Ha ocurrido un error de red. Por favor, verifica tu conexión e inténtalo de nuevo.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    }
  });
}

/* ============================================================
   Animaciones de entrada (Intersection Observer)
   ============================================================ */
function initFadeAnimations() {
  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  /* Aplicar clase y observar elementos */
  const targets = [
    '.mision__card',
    '.stats__item',
    '.team-card',
    '.nivel-card',
    '.icono-card',
    '.descarga-card',
    '.galeria__item',
    '.comunidad__card',
    '.section__intro',
  ];

  targets.forEach(sel => {
    $$(sel).forEach((el, i) => {
      el.classList.add('fade-in');
      el.style.transitionDelay = `${i * 60}ms`;
      observer.observe(el);
    });
  });
}

/* ============================================================
   Botón volver arriba
   ============================================================ */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  /* Mostrar cuando el usuario ha scrolleado más de 400px */
  const THRESHOLD = 400;

  function toggleBtn() {
    btn.classList.toggle('visible', window.scrollY > THRESHOLD);
  }

  window.addEventListener('scroll', toggleBtn, { passive: true });
  toggleBtn(); /* estado inicial */

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   Init
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initA11yWidget();
  initNav();
  initScrollEffects();
  initContactForm();
  initFadeAnimations();
  initBackToTop();
});
