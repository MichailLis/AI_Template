// Shared helpers for the 2026-10-02 UI/UX audit: login and in-page measurements.
// Read-only: nothing here submits a form or changes data.
const path = require('path');
const os = require('os');
const { chromium } = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'));

const BASE = process.env.AUDIT_BASE || 'http://localhost:5173';
// Доказательства в репозиторий не кладутся: по умолчанию они пишутся вне рабочего дерева.
const OUT =
  process.env.AUDIT_OUT ||
  path.join(os.homedir(), 'Documents', 'audit-evidence', '2026-10-02-admin-ui-ux-audit', 'run');

const ROUTES = [
  '/admin',
  '/admin/tests',
  '/admin/public-links',
  '/admin/public-links/organizations',
  '/admin/analytics',
  '/admin/users',
  '/admin/prompts',
  '/admin/settings',
];

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type=email], input[name=email]', 'admin@admin.admin');
  await page.fill('input[type=password]', 'admin123456');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(900);
}

const slug = (route) => route.replace(/^\//, '').replace(/[/?=&:]+/g, '_') || 'root';

/**
 * Runs inside the page. Returns raw measurements; classification happens in the report.
 * `rootSelector` narrows the scan to a dialog when one is open.
 */
function measure(rootSelector) {
  const root = rootSelector ? document.querySelector(rootSelector) : document.body;
  if (!root) return { error: `no root ${rootSelector}` };

  const parseColor = (value) => {
    let m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) {
      // Tailwind 4 считает `bg-primary/90` через color-mix, и computed-значение приходит как
      // oklab(...). Без пересчета такой фон терялся и кнопка под курсором выглядела белой на белом.
      const probe = document.createElement('span');
      probe.style.color = `color-mix(in srgb, ${value} 100%, transparent)`;
      document.body.append(probe);
      const srgb = getComputedStyle(probe).color.match(/color\(srgb ([^)]+)\)/);
      probe.remove();
      if (!srgb) return null;
      const [r, g, b, a = 1] = srgb[1].split(/[ /]+/).filter(Boolean).map(Number);
      return { r: r * 255, g: g * 255, b: b * 255, a };
    }
    const parts = m[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const blend = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const hex = ({ r, g, b }) =>
    '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

  // Effective background: composite translucent layers up the tree. A gradient or image makes
  // the result uncertain, which is reported instead of guessed.
  const background = (el) => {
    const layers = [];
    let uncertain = false;
    for (let node = el; node; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') uncertain = true;
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a === 1) break;
      }
    }
    let result = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) result = blend(layer, result);
    return { color: result, uncertain };
  };

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0)
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && el.offsetParent !== null;
  };

  // --- text contrast ---
  const contrast = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const sizes = {};
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || !visible(el) || el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = background(el);
    const finalFg = fg.a < 1 ? blend(fg, bg.color) : fg;
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    sizes[size] = (sizes[size] || 0) + 1;
    const large = size >= 24 || (size >= 56 / 3 && weight >= 700);
    const value = ratio(finalFg, bg.color);
    const disabled = !!el.closest(':disabled, [aria-disabled="true"], [data-disabled]');
    const key = [hex(finalFg), hex(bg.color), size, weight, bg.uncertain, disabled].join('|');
    const entry = contrast.get(key) || {
      fg: hex(finalFg),
      bg: hex(bg.color),
      size,
      weight,
      large,
      ratio: Math.round(value * 1000) / 1000,
      bgUncertain: bg.uncertain,
      disabled,
      count: 0,
      samples: [],
    };
    entry.count += 1;
    if (entry.samples.length < 4) entry.samples.push(text.slice(0, 50));
    contrast.set(key, entry);
  }

  // --- interactive targets ---
  const selector =
    'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], [role=checkbox], [role=menuitem], [role=combobox], [tabindex]:not([tabindex="-1"])';
  const name = (el) => {
    const labelled = el.getAttribute('aria-labelledby');
    if (labelled) {
      const t = labelled
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() || '')
        .join(' ')
        .trim();
      if (t) return t;
    }
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    if (el.labels && el.labels.length)
      return [...el.labels].map((l) => l.textContent.trim()).join(' ');
    const text = el.textContent.trim();
    if (text) return text.slice(0, 60);
    if (el.getAttribute('title')) return el.getAttribute('title');
    const img = el.querySelector('img[alt]');
    if (img && img.alt) return img.alt;
    return '';
  };
  const targets = [...root.querySelectorAll(selector)].filter(visible).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      role: el.getAttribute('role') || '',
      name: name(el),
      placeholder: el.getAttribute('placeholder') || '',
      hasVisibleLabel: !!(el.labels && el.labels.length) || !!el.getAttribute('aria-labelledby'),
      disabled: el.matches(':disabled, [aria-disabled="true"]'),
      x: Math.round(r.x),
      y: Math.round(r.y + window.scrollY),
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      inline: getComputedStyle(el).display === 'inline',
    };
  });

  // Spacing exception of SC 2.5.8: a 24px circle centred on an undersized target must not
  // intersect another target or the circle of another undersized target.
  const small = targets.filter((t) => t.w < 24 || t.h < 24);
  const centre = (t) => ({ cx: t.x + t.w / 2, cy: t.y + t.h / 2 });
  for (const t of small) {
    const { cx, cy } = centre(t);
    t.spacingViolations = [];
    for (const other of targets) {
      if (other === t) continue;
      const otherSmall = other.w < 24 || other.h < 24;
      if (otherSmall) {
        const o = centre(other);
        if (Math.hypot(o.cx - cx, o.cy - cy) < 24)
          t.spacingViolations.push(other.name || other.tag);
      } else {
        const nx = Math.max(other.x, Math.min(cx, other.x + other.w));
        const ny = Math.max(other.y, Math.min(cy, other.y + other.h));
        if (Math.hypot(nx - cx, ny - cy) < 12) t.spacingViolations.push(other.name || other.tag);
      }
    }
  }

  // --- structure ---
  const headings = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')]
    .filter(visible)
    .map((h) => `${h.tagName.toLowerCase()}: ${h.textContent.trim().slice(0, 70)}`);
  const landmarks = [...document.querySelectorAll('header,nav,main,aside,footer,[role]')]
    .filter(visible)
    .map((l) => l.getAttribute('role') || l.tagName.toLowerCase())
    .reduce((acc, k) => ((acc[k] = (acc[k] || 0) + 1), acc), {});

  // --- reflow ---
  const doc = document.documentElement;
  const overflowing = [];
  if (doc.scrollWidth > doc.clientWidth + 1) {
    for (const el of root.querySelectorAll('*')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 && r.width < doc.clientWidth * 3) {
        overflowing.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)} "${el.textContent.trim().slice(0, 30)}"`,
        );
      }
      if (overflowing.length >= 15) break;
    }
  }
  // Text clipped by its own box (truncate / overflow hidden).
  const clipped = [...root.querySelectorAll('*')]
    .filter((el) => visible(el) && el.children.length === 0 && el.textContent.trim())
    .filter((el) => {
      const cs = getComputedStyle(el);
      return cs.overflow !== 'visible' && el.scrollWidth > el.clientWidth + 1;
    })
    .slice(0, 20)
    .map((el) => `${el.textContent.trim().slice(0, 60)} (${el.clientWidth}/${el.scrollWidth})`);

  return {
    url: location.pathname + location.search,
    title: document.title,
    lang: doc.lang,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scroll: {
      docWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      docHeight: doc.scrollHeight,
    },
    headings,
    landmarks,
    fontSizes: sizes,
    contrast: [...contrast.values()].sort((a, b) => a.ratio - b.ratio),
    targets,
    overflowing,
    clipped,
  };
}

module.exports = { chromium, BASE, OUT, ROUTES, login, settle, slug, measure };
