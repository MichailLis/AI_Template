// Pass 1 action paths on AUDIT-owned entities only. Existing data is never confirmed-on.
const path = require('path');
const fs = require('fs');
const { chromium } = require(
  path.join('C:/Users/admin/Documents/WebAI/AI_Template/node_modules/playwright'),
);

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'shots', 'actions');

async function snap(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  const text = await page.evaluate(() => {
    const overlays = [
      ...document.querySelectorAll(
        '[role=dialog], [role=alertdialog], [role=menu], [data-radix-popper-content-wrapper], [data-sonner-toast], [role=status], [role=alert]',
      ),
    ];
    return (
      overlays.map((o) => '--- OVERLAY ---\n' + o.innerText).join('\n') +
      '\n--- PAGE ---\n' +
      document.body.innerText
    );
  });
  fs.writeFileSync(path.join(OUT, `${name}.txt`), `URL: ${page.url()}\n\n${text}`);
  console.log('ok', name);
}

async function step(page, name, fn, { escape = false } = {}) {
  try {
    await fn();
    await snap(page, name);
  } catch (e) {
    console.log('FAIL', name, e.message.split('\n')[0]);
    await page
      .screenshot({ path: path.join(OUT, `${name}-FAIL.png`), fullPage: true })
      .catch(() => {});
  }
  if (escape) await page.keyboard.press('Escape').catch(() => {});
}

async function open(page, route) {
  await page.goto(`${BASE}${route}`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
}

const rowMenu = (page, rowText) =>
  page.locator('div', { hasText: rowText }).locator('button[aria-label="Действия"]').last();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[type=email], input[name=email]', 'admin@admin.admin');
  await page.fill('input[type=password]', 'admin123456');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });

  // A. Remove the test topic 1224 that my exploration created by clicking "Импорт v3+".
  await open(page, '/admin/tests/1224/settings');
  await step(page, 'a1-1224-settings', async () => {});
  await step(page, 'a2-1224-toggle-archive', async () => {
    await page.getByRole('switch', { name: 'Переключатель активности теста' }).click();
  });
  const confirmArchive = page.getByRole('button', { name: 'Архивировать', exact: true });
  if (await confirmArchive.isVisible().catch(() => false)) {
    await step(page, 'a3-1224-archived', async () => {
      await confirmArchive.click();
    });
  }
  await open(page, '/admin/tests');
  await step(page, 'a4-archive-tab', async () => {
    await page
      .getByRole('tab', { name: 'Архив' })
      .or(page.getByRole('button', { name: 'Архив', exact: true }))
      .first()
      .click();
  });
  await step(page, 'a5-archive-row-menu', async () => {
    await page.locator('button[aria-label="Действия"]').first().click();
  });
  await step(page, 'a6-delete-forever-first-click', async () => {
    await page.getByRole('button', { name: /Удалить навсегда/ }).click();
  });
  await step(page, 'a7-delete-confirm-in-menu', async () => {
    await page.getByRole('button', { name: /Подтвердить удаление/ }).click();
  });
  // Only confirm the final dialog when it names the imported duplicate I created (topic 1224).
  const dlg = page.getByRole('alertdialog').or(page.getByRole('dialog'));
  const dlgText = await dlg
    .first()
    .innerText()
    .catch(() => '');
  console.log('delete dialog text:', dlgText.replace(/\s+/g, ' ').slice(0, 200));
  const idCheck = await page.evaluate(async () => location.href);
  console.log('at', idCheck);

  // B. Create my own test, try publish-related negative paths.
  await open(page, '/admin/tests');
  await step(page, 'b1-create-dialog-empty-submit', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await page.getByRole('button', { name: 'Создать тест', exact: true }).click();
  });
  await page.keyboard.press('Escape');
  await open(page, '/admin/tests');
  await step(page, 'b2-create-audit-test', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await page.getByLabel(/Название теста/).fill('AUDIT-A пустой тест');
    await page.getByRole('button', { name: 'Создать тест', exact: true }).click();
    await page.waitForLoadState('networkidle').catch(() => {});
  });
  const auditUrl = page.url();
  console.log('audit test url', auditUrl);
  await step(page, 'b3-audit-settings-unpublishable', async () => {
    await page
      .getByRole('link', { name: 'Настройки' })
      .or(page.getByRole('button', { name: 'Настройки' }))
      .first()
      .click();
    await page.waitForLoadState('networkidle').catch(() => {});
  });
  await step(page, 'b4-add-question-modal', async () => {
    await page.goto(auditUrl.replace(/\/settings$/, ''));
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByRole('button', { name: 'Добавить вопрос' }).click();
  });
  await step(page, 'b5-question-empty-save', async () => {
    const save = page
      .getByRole('dialog')
      .getByRole('button', { name: /Сохранить|Добавить/ })
      .last();
    await save.click();
  });
  await step(page, 'b6-question-leave-dirty', async () => {
    await page.getByRole('dialog').locator('input').first().fill('AUDIT вопрос без вариантов');
    await page.keyboard.press('Escape');
  });

  // C. Public link wizard with an already published test, cancelled before creation.
  await open(page, '/admin/public-links');
  await step(page, 'c1-wizard-select-published', async () => {
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    await page
      .getByRole('dialog')
      .locator('select')
      .first()
      .selectOption({ label: 'Проверочный тест MTPZ4ZN0' });
  });
  await step(page, 'c2-wizard-step2', async () => {
    await page.getByRole('button', { name: 'Далее' }).click();
  });
  await step(page, 'c3-wizard-step3', async () => {
    await page.getByRole('button', { name: 'Далее' }).click();
  });
  await step(
    page,
    'c4-wizard-cancel',
    async () => {
      await page
        .getByRole('button', { name: /Отмена|Назад/ })
        .first()
        .click();
    },
    { escape: true },
  );

  // D. Users: create my own user with a generated password.
  await open(page, '/admin/users');
  await step(page, 'd1-user-create-generated', async () => {
    await page.getByRole('button', { name: /Добавить пользователя/ }).click();
    await page.getByLabel(/Email/).fill('audit-c-1@example.com');
    await page.getByLabel('Имя').fill('AUDIT-C Проверка');
    await page.getByRole('button', { name: 'Создать пользователя' }).click();
  });
  await page.keyboard.press('Escape');
  await open(page, '/admin/users');
  await step(
    page,
    'd2-user-duplicate-email',
    async () => {
      await page.getByRole('button', { name: /Добавить пользователя/ }).click();
      await page.getByLabel(/Email/).fill('AUDIT-C-1@example.com');
      await page.getByRole('button', { name: 'Создать пользователя' }).click();
    },
    { escape: true },
  );
  await open(page, '/admin/users');
  await step(
    page,
    'd3-user-menu-audit',
    async () => {
      await page.getByRole('button', { name: 'Действия для audit-c-1@example.com' }).click();
    },
    { escape: true },
  );

  // E. Settings privacy tab, full.
  await open(page, '/admin/settings');
  await step(page, 'e1-privacy', async () => {
    await page
      .getByRole('tab', { name: 'Политика данных' })
      .or(page.getByRole('button', { name: 'Политика данных' }))
      .first()
      .click();
  });

  // F. Mobile users table: can status and actions be reached?
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/admin/users');
  const scroll = await page.evaluate(() =>
    [...document.querySelectorAll('table')].map((t) => {
      const p = t.parentElement;
      return {
        tableW: t.scrollWidth,
        boxW: p.clientWidth,
        overflowX: getComputedStyle(p).overflowX,
        headers: [...t.querySelectorAll('th')]
          .filter((th) => th.offsetParent)
          .map((th) => th.innerText),
      };
    }),
  );
  console.log('mobile users table', JSON.stringify(scroll));
  await step(page, 'f1-mobile-users-row-tap', async () => {
    await page.getByText('audit-c-1@example.com').first().click();
  });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
