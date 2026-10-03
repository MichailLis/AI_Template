// Pass 2: keyboard walk, menus, dialogs and empty-form submits.
// Every non-GET request except the login is aborted, so the pass cannot change data.
// usage: node states.cjs [width=1440] [only=substring]
const fs = require('fs');
const path = require('path');
const { chromium, BASE, OUT, ROUTES, login, settle, slug, measure } = require('./lib.cjs');

const width = Number(process.argv[2] || 1440);
const only = process.argv[3] || '';
const height = width >= 1024 ? 900 : 812;
const log = [];
const note = (...parts) => {
  const line = parts.join(' ');
  log.push(line);
  console.log(line);
};

function focusInfo() {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'body' };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  const inViewport = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  return {
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || '',
    name: (
      el.getAttribute('aria-label') ||
      el.textContent.trim() ||
      el.getAttribute('placeholder') ||
      ''
    ).slice(0, 50),
    rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} off=${cs.outlineOffset}`,
    boxShadow: cs.boxShadow.slice(0, 120),
    border: cs.borderColor,
    inViewport,
    obscured: inViewport && top ? !(el === top || el.contains(top) || top.contains(el)) : null,
    obscuredBy:
      top && !(el === top || el.contains(top) || top.contains(el))
        ? `${top.tagName.toLowerCase()}.${String(top.className).slice(0, 50)}`
        : '',
    inDialog: !!el.closest('[role=dialog],[role=menu],[role=alertdialog]'),
  };
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  await login(page);

  const blocked = [];
  await page.route('**/*', (route) => {
    const req = route.request();
    if (req.method() !== 'GET' && !/\/auth\/(refresh|login)/.test(req.url())) {
      blocked.push(`${req.method()} ${new URL(req.url()).pathname}`);
      return route.abort();
    }
    return route.continue();
  });

  const capture = async (name, root) => {
    const file = `${width}_state_${name}`;
    await page.screenshot({ path: path.join(OUT, 'shots', `${file}.png`) });
    const data = await page.evaluate(measure, root || null);
    data.aria = root
      ? await page
          .locator(root)
          .first()
          .ariaSnapshot()
          .catch((e) => `ariaSnapshot failed: ${e.message}`)
      : undefined;
    fs.writeFileSync(path.join(OUT, 'data', `${file}.json`), JSON.stringify(data, null, 2));
    return data;
  };
  const go = async (route) => {
    await page.goto(`${BASE}${route}`);
    await settle(page);
  };
  const overlay = '[role=dialog],[role=alertdialog],[role=menu]';
  const step = async (name, fn) => {
    if (only && !name.includes(only)) return;
    try {
      await fn();
    } catch (e) {
      note(`!! ${name}: ${e.message.split('\n')[0]}`);
    }
  };

  /** Opens an overlay with `open`, records focus on open, the trap, Escape and focus return. */
  const overlayCheck = async (name, open, { submit } = {}) => {
    await open();
    await page.waitForTimeout(500);
    const count = await page.locator(overlay).count();
    if (!count) {
      note(`${name}: no overlay appeared; url=${page.url()}`);
      await capture(name);
      return;
    }
    const kind = await page.locator(overlay).first().getAttribute('role');
    const onOpen = await page.evaluate(focusInfo);
    await capture(name, overlay);
    // Trap: 40 tabs must stay inside the overlay.
    let escaped = false;
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(focusInfo);
      if (!f.inDialog) {
        escaped = `${f.tag}:${f.name}`;
        break;
      }
    }
    if (submit) {
      const before = blocked.length;
      const button = page.locator(overlay).first().locator(submit).last();
      const disabled = await button.isDisabled().catch(() => 'n/a');
      if (disabled === false) {
        await button.click();
        await page.waitForTimeout(700);
        await capture(`${name}_submit-empty`, overlay);
      }
      const invalid = await page
        .locator(`${overlay}`)
        .first()
        .locator('[aria-invalid=true]')
        .count();
      const alerts = await page.locator('[role=alert], [aria-live]').allTextContents();
      const focusAfter = await page.evaluate(focusInfo);
      note(
        `${name}: submit disabled=${disabled} requests=${JSON.stringify(blocked.slice(before))} ariaInvalid=${invalid} focusAfter=${focusAfter.tag}:${focusAfter.name} live=${JSON.stringify(alerts.map((a) => a.trim().slice(0, 80)).filter(Boolean))}`,
      );
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const stillOpen = await page.locator(overlay).count();
    const afterClose = await page.evaluate(focusInfo);
    note(
      `${name}: role=${kind} focusOnOpen=${onOpen.tag}:${onOpen.name} inOverlay=${onOpen.inDialog} trapEscapedTo=${escaped} closedByEsc=${!stillOpen} focusReturn=${afterClose.tag}:${afterClose.name}`,
    );
    if (stillOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  };

  // --- keyboard walk on every route ---
  for (const route of ROUTES.slice(1)) {
    await step(`tab_${slug(route)}`, async () => {
      await go(route);
      const seq = [];
      for (let i = 0; i < 70; i += 1) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(focusInfo);
        if (f.tag === 'body') break;
        seq.push(f);
        if (i === 14)
          await page.screenshot({
            path: path.join(OUT, 'shots', `${width}_focus_${slug(route)}.png`),
          });
      }
      fs.writeFileSync(
        path.join(OUT, 'data', `${width}_tab_${slug(route)}.json`),
        JSON.stringify(seq, null, 2),
      );
      const noIndicator = seq.filter((f) => f.outline.startsWith('none') && f.boxShadow === 'none');
      const obscured = seq.filter((f) => f.obscured);
      note(
        `tab ${route}: stops=${seq.length} noIndicator=${noIndicator.length} ${JSON.stringify(noIndicator.slice(0, 5).map((f) => f.tag + ':' + f.name))} obscured=${obscured.length} ${JSON.stringify(obscured.slice(0, 5).map((f) => f.name + ' by ' + f.obscuredBy))} first=${seq
          .slice(0, 3)
          .map((f) => f.name)
          .join(' > ')}`,
      );
    });
  }

  // --- tests ---
  await step('tests_row', async () => {
    await go('/admin/tests');
    await page.locator('main button', { hasText: 'Демо: профориентационный тест' }).first().click();
    await settle(page);
    note(`tests_row: url=${page.url()}`);
    await capture('tests_row-open');
    await page.screenshot({
      path: path.join(OUT, 'shots', `${width}_state_tests_row-open_full.png`),
      fullPage: true,
    });
  });
  await step('tests_menu', async () => {
    await go('/admin/tests');
    await overlayCheck('tests_menu', () =>
      page.getByRole('button', { name: 'Действия' }).first().click(),
    );
  });
  for (const [key, label] of [
    ['create', 'Создать'],
    ['ai', 'Сгенерировать с ИИ'],
    ['import', 'Импорт v3+'],
  ]) {
    await step(`tests_${key}`, async () => {
      await go('/admin/tests');
      await overlayCheck(
        `tests_${key}`,
        () => page.getByRole('button', { name: label, exact: true }).click(),
        {
          submit: 'button[type=submit], button:not([aria-label])',
        },
      );
    });
  }

  // --- public links ---
  await step('links_create', async () => {
    await go('/admin/public-links');
    await overlayCheck(
      'links_create',
      () => page.getByRole('button', { name: 'Создать', exact: true }).click(),
      {
        submit: 'button[type=submit]',
      },
    );
  });
  await step('links_qr', async () => {
    await go('/admin/public-links');
    await overlayCheck('links_qr', () =>
      page.getByRole('button', { name: /QR-код для DEMO2026/ }).click(),
    );
  });
  await step('links_menu', async () => {
    await go('/admin/public-links');
    await overlayCheck('links_menu', () =>
      page.getByRole('button', { name: 'Действия публичной ссылки' }).last().click(),
    );
  });
  await step('links_code', async () => {
    await go('/admin/public-links');
    await page.getByRole('button', { name: 'DEMO2026', exact: true }).click();
    await settle(page);
    note(`links_code: url=${page.url()} overlays=${await page.locator(overlay).count()}`);
    await capture('links_code-open');
    await page.screenshot({
      path: path.join(OUT, 'shots', `${width}_state_links_code-open_full.png`),
      fullPage: true,
    });
  });

  // --- organizations ---
  await step('orgs_add', async () => {
    await go('/admin/public-links/organizations');
    await overlayCheck(
      'orgs_add',
      () => page.getByRole('button', { name: 'Добавить заведение' }).click(),
      {
        submit: 'button[type=submit]',
      },
    );
  });
  await step('orgs_edit', async () => {
    await go('/admin/public-links/organizations');
    await overlayCheck('orgs_edit', () =>
      page.getByRole('button', { name: /Редактировать Демо лицей/ }).click(),
    );
  });
  await step('orgs_filter', async () => {
    await go('/admin/public-links/organizations');
    const info = await page.evaluate(() =>
      [...document.querySelectorAll('main button')]
        .filter((b) => /Все заведения|Требуют заполнения/.test(b.textContent))
        .map((b) => ({
          text: b.textContent.trim(),
          pressed: b.getAttribute('aria-pressed'),
          selected: b.getAttribute('aria-selected'),
          role: b.getAttribute('role'),
          bg: getComputedStyle(b).backgroundColor,
          border: getComputedStyle(b).borderColor,
        })),
    );
    note(`orgs_filter: ${JSON.stringify(info)}`);
  });

  // --- analytics ---
  await step('analytics_attempts', async () => {
    await go('/admin/analytics');
    await page.getByRole('tab', { name: 'Прохождения' }).click();
    await settle(page);
    await capture('analytics_attempts');
    await page.screenshot({
      path: path.join(OUT, 'shots', `${width}_state_analytics_attempts_full.png`),
      fullPage: true,
    });
    const rows = page.locator('main tbody tr');
    note(`analytics_attempts: rows=${await rows.count()}`);
    if (await rows.count()) {
      await overlayCheck('analytics_attempt-detail', () => rows.first().click());
    }
  });

  // --- users ---
  await step('users_add', async () => {
    await go('/admin/users');
    await overlayCheck(
      'users_add',
      () => page.getByRole('button', { name: 'Добавить пользователя' }).click(),
      {
        submit: 'button[type=submit]',
      },
    );
  });
  await step('users_menu', async () => {
    await go('/admin/users');
    const trigger = page.getByRole('button', { name: 'Действия для teacher@example.com' });
    await trigger.click();
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => {
      const t = document.querySelector('[aria-label="Действия для teacher@example.com"]');
      return {
        expanded: t.getAttribute('aria-expanded'),
        haspopup: t.getAttribute('aria-haspopup'),
        controls: t.getAttribute('aria-controls'),
        menuRoles: document.querySelectorAll('[role=menu]').length,
      };
    });
    await capture('users_menu');
    await page.keyboard.press('Tab');
    const next = await page.evaluate(focusInfo);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const items = await page
      .getByRole('button', { name: /Сбросить пароль|Редактировать|Отключить|права/ })
      .count();
    note(
      `users_menu: ${JSON.stringify(info)} tabGoesTo=${next.tag}:${next.name} itemsAfterEsc=${items}`,
    );
  });
  await step('users_search', async () => {
    await go('/admin/users');
    await page.getByPlaceholder('Поиск по email или имени…').fill('zzzz-нет-такого');
    await page.getByRole('button', { name: 'Найти' }).click();
    await settle(page);
    await capture('users_empty-search');
  });

  // --- prompts ---
  await step('prompts_history', async () => {
    await go('/admin/prompts');
    await overlayCheck('prompts_history', () =>
      page.getByRole('button', { name: /История промпта Профориентация/ }).click(),
    );
  });
  await step('prompts_delete', async () => {
    await go('/admin/prompts');
    await overlayCheck('prompts_delete', () =>
      page
        .getByRole('button', { name: /Удалить промпт archive-e2e/ })
        .first()
        .click(),
    );
  });

  // --- settings ---
  for (const tab of ['Атлас профессий', 'Политика данных']) {
    await step(`settings_${tab}`, async () => {
      await go('/admin/settings');
      await page.getByRole('tab', { name: tab }).click();
      await settle(page);
      const key = tab === 'Атлас профессий' ? 'atlas' : 'policy';
      await capture(`settings_${key}`);
      await page.screenshot({
        path: path.join(OUT, 'shots', `${width}_state_settings_${key}_full.png`),
        fullPage: true,
      });
    });
  }

  note(`blocked writes: ${JSON.stringify(blocked)}`);
  fs.writeFileSync(path.join(OUT, 'data', `${width}_states.log`), log.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
