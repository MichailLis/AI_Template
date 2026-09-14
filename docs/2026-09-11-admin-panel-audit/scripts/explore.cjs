// Pass 1 deep look: open dialogs, menus and tabs WITHOUT submitting anything.
const path = require('path');
const fs = require('fs');
const { chromium } = require(
  path.join('C:/Users/admin/Documents/WebAI/AI_Template/node_modules/playwright'),
);

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'shots', 'explore');

async function snap(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  const text = await page.evaluate(() => {
    const dlg = document.querySelector(
      '[role=dialog], [role=menu], [data-radix-popper-content-wrapper]',
    );
    return (
      (dlg ? '--- OVERLAY ---\n' + dlg.innerText + '\n\n--- PAGE ---\n' : '') +
      document.body.innerText
    );
  });
  fs.writeFileSync(path.join(OUT, `${name}.txt`), `URL: ${page.url()}\n\n${text}`);
  console.log('ok', name);
}

async function step(page, name, fn) {
  try {
    await fn();
    await snap(page, name);
  } catch (e) {
    console.log('FAIL', name, e.message.split('\n')[0]);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
}

async function open(page, route) {
  await page.goto(`${BASE}${route}`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await snap(page, '00-login-redirected');
  await page.fill('input[type=email], input[name=email]', 'admin@admin.admin');
  await page.fill('input[type=password]', 'admin123456');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });

  // Tests
  await open(page, '/admin/tests');
  await step(page, '10-tests-row-menu', async () => {
    await page
      .locator('main button:has(svg)')
      .filter({ hasText: '' })
      .nth(0)
      .click({ trial: true });
    const menus = page.locator('button[aria-haspopup=menu]');
    await menus.first().click();
  });
  await step(page, '11-tests-create', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
  });
  await open(page, '/admin/tests');
  await step(page, '12-tests-generate-ai', async () => {
    await page.getByRole('button', { name: /Сгенерировать с ИИ/ }).click();
  });
  await open(page, '/admin/tests');
  await step(page, '13-tests-import', async () => {
    await page.getByRole('button', { name: /Импорт v3\+/ }).click();
  });
  await open(page, '/admin/tests');
  await step(page, '14-tests-archive-tab', async () => {
    await page
      .getByRole('tab', { name: 'Архив' })
      .or(page.getByRole('button', { name: 'Архив' }))
      .first()
      .click();
  });
  await step(page, '15-test-editor-1007', async () => {
    await open(page, '/admin/tests/1007');
  });
  await step(page, '16-test-settings-1007', async () => {
    await open(page, '/admin/tests/1007/settings');
  });
  await open(page, '/admin/tests');
  await step(page, '17-test-editor-v3-first', async () => {
    await page.getByText('Профориентационный тест v3+', { exact: true }).first().click();
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  // Public links
  await open(page, '/admin/public-links');
  await step(page, '20-links-create', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
  });
  await open(page, '/admin/public-links');
  await step(page, '21-links-row-menu', async () => {
    await page.getByRole('button', { name: 'Действия публичной ссылки' }).first().click();
  });
  await open(page, '/admin/public-links');
  await step(page, '22-links-qr', async () => {
    await page
      .getByRole('button', { name: /Показать QR-код/ })
      .first()
      .click();
  });
  await open(page, '/admin/public-links');
  await step(page, '23-links-archive', async () => {
    await page
      .getByRole('tab', { name: 'Архив' })
      .or(page.getByRole('button', { name: 'Архив' }))
      .first()
      .click();
  });
  await open(page, '/admin/public-links');
  await step(page, '24-links-row-open-edit', async () => {
    await page.getByText('DEMO2026', { exact: true }).click();
  });

  // Organizations
  await open(page, '/admin/public-links/organizations');
  await step(page, '30-org-edit', async () => {
    await page.getByRole('button', { name: /Редактировать Демо лицей/ }).click();
  });
  await open(page, '/admin/public-links/organizations');
  await step(page, '31-org-create', async () => {
    await page.getByRole('button', { name: /Добавить заведение/ }).click();
  });

  // Analytics
  await open(page, '/admin/analytics?tab=attempts');
  await step(page, '40-analytics-attempts', async () => {});
  await step(page, '41-analytics-attempt-detail', async () => {
    await page.locator('table tbody tr').first().click();
  });

  // Users
  await open(page, '/admin/users');
  await step(page, '50-users-create', async () => {
    await page.getByRole('button', { name: /Добавить пользователя/ }).click();
  });
  await open(page, '/admin/users');
  await step(page, '51-users-menu-self', async () => {
    await page.getByRole('button', { name: 'Действия для admin@admin.admin' }).click();
  });
  await open(page, '/admin/users');
  await step(page, '52-users-menu-other', async () => {
    await page.getByRole('button', { name: 'Действия для teacher@example.com' }).click();
  });

  // Prompts
  await open(page, '/admin/prompts');
  await step(page, '60-prompts-open-saved', async () => {
    await page.getByText('Профориентация v3+: обогащение результата').click();
  });
  await open(page, '/admin/prompts');
  await step(page, '61-prompts-delete-dialog', async () => {
    await page
      .getByRole('button', { name: /Удалить промпт/ })
      .first()
      .click();
  });

  // Settings
  await open(page, '/admin/settings');
  await step(page, '70-settings-atlas', async () => {
    await page
      .getByRole('tab', { name: 'Атлас профессий' })
      .or(page.getByRole('button', { name: 'Атлас профессий' }))
      .first()
      .click();
  });
  await open(page, '/admin/settings');
  await step(page, '71-settings-privacy', async () => {
    await page
      .getByRole('tab', { name: 'Политика данных' })
      .or(page.getByRole('button', { name: 'Политика данных' }))
      .first()
      .click();
  });

  // Shell: menu search
  await open(page, '/admin/tests');
  await step(page, '80-shell-search', async () => {
    await page.getByLabel('Найти раздел админки').fill('поль');
  });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
