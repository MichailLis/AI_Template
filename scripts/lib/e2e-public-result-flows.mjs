// Student scenarios of `verify:e2e:critical` that run past the first question: answers, the
// "finish" button and the result screen. Every scenario reads visible text, because "no browser
// error" is also true of a blank page. The API is the mock from `e2e-public-mock.mjs`.
import {
  aiText,
  createPublicMock,
  profText,
  publicQuestions,
  resultBodies,
  sessionToken,
  studentAnswers,
} from './e2e-public-mock.mjs';

const resultPath = `/t/SMOKE/result/${sessionToken}`;
const runPath = `/t/SMOKE/session/${sessionToken}`;
const resultChunk = /assets\/public-test-result-page-[\w-]+\.js/;
const pollIntervalMs = 3_000;

export const fillPublicEntryForm = async (page) => {
  await page.getByLabel('Имя').fill('Иван');
  await page.getByLabel('Фамилия (1-я буква)').fill('И');
  await page.getByLabel('Отчество (1-я буква)').fill('О');
  await page.getByLabel('Учебное заведение').fill('Школа');
  await page.getByLabel('Группа / класс').fill('СМ-1');
  await page.getByRole('checkbox', { name: /политик/i }).check();
};

const sees = (page, text) =>
  page.getByText(text, { exact: false }).first().waitFor({ timeout: 10000 });

const expectGone = async (page, text) => {
  const count = await page.getByText(text, { exact: false }).count();
  if (count > 0) throw new Error(`Text must not be on the screen: "${text}"`);
};

const answerAndFinish = async (page) => {
  const answerBox = page.getByPlaceholder('Введите ответ');

  await sees(page, publicQuestions[0].title);
  await answerBox.fill(studentAnswers[0]);
  await page.getByRole('button', { name: /Далее/ }).click();
  await sees(page, publicQuestions[1].title);
  await answerBox.fill(studentAnswers[1]);
  await page.getByRole('button', { name: /Завершить тест/ }).click();
  await page.waitForURL(`**${resultPath}`, { timeout: 10000 });
};

// The answers must reach the server before the finish call, and the result is read after it.
const assertAnswersSentBeforeFinish = (mock) => {
  const lastSave = mock.savedPayloads.at(-1) ?? [];
  const sent = studentAnswers.every((text, index) =>
    lastSave.some(
      (answer) => answer.questionId === publicQuestions[index].id && answer.answerPayload === text,
    ),
  );
  const { calls } = mock;
  if (!sent || calls.lastIndexOf('PUT answers') > calls.indexOf('POST finish')) {
    throw new Error(
      `Answers did not reach PUT .../answers before finish. Calls: ${calls.join(', ')}`,
    );
  }
  if (calls.indexOf('POST finish') > calls.indexOf('GET result')) {
    throw new Error(`The result was read before the finish call. Calls: ${calls.join(', ')}`);
  }
};

const runScenario = async (harness, name, options, body) => {
  const mock = createPublicMock(options);
  const { page, assertHealthy, close } = await harness.openMockedPage({
    publicMock: mock,
    allowedBrowserErrors: options.allowedBrowserErrors,
  });

  try {
    await body(page, mock);
    assertHealthy();
  } catch (error) {
    const bodyText = (await page.textContent('body').catch(() => '')) ?? '';
    throw new Error(
      [
        `Student scenario "${name}" failed: ${error instanceof Error ? error.message : String(error)}`,
        `Current URL: ${page.url()}`,
        `Visible text: ${bodyText.replace(/\s+/g, ' ').slice(0, 800)}`,
        `API calls: ${mock.calls.join(', ') || 'none'}`,
      ].join('\n'),
      { cause: error },
    );
  } finally {
    await close();
  }
  console.log(`✓ ${name}`);
};

const openRunScreen = (harness, page) => page.goto(`${harness.baseUrl}${runPath}`);

const standardAiAnalysis = (harness) =>
  runScenario(
    harness,
    'STANDARD + AI analysis: answers -> finish -> result with the AI text',
    { template: 'STANDARD', results: [resultBodies.aiAnalysis('STANDARD')] },
    async (page, mock) => {
      await page.goto(`${harness.baseUrl}/t/SMOKE`);
      await sees(page, 'Smoke Public Test');
      await fillPublicEntryForm(page);
      await page.getByRole('button', { name: /Начать тестирование/ }).click();
      await page.waitForURL(`**${runPath}`, { timeout: 10000 });
      await answerAndFinish(page);

      await sees(page, 'Результат теста');
      await sees(page, aiText.introduction);
      await sees(page, aiText.skillsTitle);
      await sees(page, aiText.skillName);
      await sees(page, aiText.thinkingType);
      await sees(page, aiText.nextStep);
      await sees(page, 'Скачать PDF');
      assertAnswersSentBeforeFinish(mock);
    },
  );

const polusProfOrientation = (harness) =>
  runScenario(
    harness,
    'POLUS + profession orientation: finish -> waiting screen -> POLUS result',
    {
      template: 'POLUS',
      results: [
        resultBodies.profOrientation('POLUS', 'pending'),
        resultBodies.profOrientation('POLUS', 'ready'),
      ],
    },
    async (page, mock) => {
      await page.clock.install();
      await openRunScreen(harness, page);
      await answerAndFinish(page);

      await sees(page, 'Профессор Полюс анализирует');
      await expectGone(page, profText.professorSummary);
      await page.clock.fastForward(pollIntervalMs);

      await sees(page, 'Профессор Полюс говорит');
      await sees(page, profText.headline);
      await sees(page, profText.professorSummary);
      await sees(page, 'Персональная карта развития');
      await sees(page, profText.profession);
      await expectGone(page, 'Профессор Полюс анализирует');
      assertAnswersSentBeforeFinish(mock);
    },
  );

const standardProfOrientation = (harness) =>
  runScenario(
    harness,
    'STANDARD + profession orientation: standard result screen without POLUS nodes',
    { template: 'STANDARD', results: [resultBodies.profOrientation('STANDARD', 'ready')] },
    async (page) => {
      await openRunScreen(harness, page);
      await answerAndFinish(page);

      await sees(page, 'Результат теста');
      await sees(page, profText.headline);
      await sees(page, profText.professorSummary);
      await sees(page, profText.profession);
      const polusNodes = await page.locator('[class*="polus-"]').count();
      if (polusNodes > 0) throw new Error(`${polusNodes} polus-* nodes on the STANDARD result`);
    },
  );

const noResultCases = [
  {
    template: 'POLUS',
    body: resultBodies.none('POLUS'),
    texts: ['Ответы сохранены', 'Результат для этого теста не предусмотрен'],
  },
  {
    template: 'POLUS',
    body: resultBodies.failed('POLUS'),
    texts: ['Не удалось сформировать анализ', 'Ваши ответы сохранены'],
  },
  {
    template: 'STANDARD',
    body: resultBodies.none('STANDARD'),
    texts: ['Тестирование завершено', 'Подробный анализ для этого теста не предусмотрен'],
  },
];

// Nothing was calculated: the student must read that, and must not see an invented profile.
const honestNoResult = async (harness) => {
  for (const { template, body, texts } of noResultCases) {
    await runScenario(
      harness,
      `${template} + no result (${body.analysis.status}/${body.analysis.providerMode}): honest state, no invented profile`,
      { template, results: [body] },
      async (page) => {
        await openRunScreen(harness, page);
        await answerAndFinish(page);

        for (const text of texts) await sees(page, text);
        const shown = (await page.textContent('body')) ?? '';
        if (/\d+\s?%/.test(shown) || shown.includes('Ваш профиль')) {
          throw new Error(
            `The screen shows a profile that was never calculated: ${shown.slice(0, 300)}`,
          );
        }
        await expectGone(page, 'Скачать');
      },
    );
  }
};

// After a deploy the old hashed chunk is gone. One reload must bring the new page; if the chunk
// is still missing, the student gets the "refresh" screen, not a white page and not a reload loop.
const staleChunk = async (harness) => {
  // What the missing chunk itself logs: the 404, the failed import, and the lazy page reading
  // `default` of the module that never arrived (the error boundary catches it, then the reload).
  const stale = {
    allowedBrowserErrors: [
      /status of 404/,
      /dynamically imported module/,
      /Route render failed/,
      /reading 'default'/,
    ],
  };
  const results = [resultBodies.aiAnalysis('STANDARD')];

  for (const { name, healsOnReload } of [
    { name: 'stale result chunk: one reload brings the result', healsOnReload: true },
    { name: 'result chunk stays missing: refresh screen after one reload', healsOnReload: false },
  ]) {
    await runScenario(harness, name, { template: 'STANDARD', results, ...stale }, async (page) => {
      let reloads = 0;
      page.on('request', (request) => {
        if (request.isNavigationRequest() && request.url().endsWith(resultPath)) reloads += 1;
      });
      await page.route(resultChunk, (route) =>
        healsOnReload && reloads > 0
          ? route.continue()
          : route.fulfill({ status: 404, body: 'Not found' }),
      );
      await openRunScreen(harness, page);
      await answerAndFinish(page);

      if (healsOnReload) {
        await sees(page, aiText.introduction);
      } else {
        await sees(page, 'Не удалось показать страницу');
        await page.getByRole('button', { name: 'Обновить страницу' }).waitFor();
        await page.waitForTimeout(300);
      }
      if (reloads !== 1) throw new Error(`Expected exactly one reload, got ${reloads}`);
      if (((await page.textContent('#root')) ?? '').trim() === '') throw new Error('Blank #root');
    });
  }
};

// One failed poll must not take the waiting screen away from the student (#121).
const failedResultPoll = (harness) =>
  runScenario(
    harness,
    'result poll fails once: waiting screen stays, the result appears after recovery',
    {
      template: 'STANDARD',
      results: [
        resultBodies.profOrientation('STANDARD', 'pending'),
        { httpStatus: 503 },
        resultBodies.profOrientation('STANDARD', 'ready'),
      ],
      allowedBrowserErrors: [/status of 503/],
    },
    async (page, mock) => {
      await page.clock.install();
      await openRunScreen(harness, page);
      await answerAndFinish(page);
      await sees(page, 'Формируем отчет');

      const failedPoll = page.waitForResponse((response) => response.status() === 503);
      await page.clock.fastForward(pollIntervalMs);
      await failedPoll;
      await page.waitForTimeout(300);
      await sees(page, 'Формируем отчет');
      await expectGone(page, 'Не удалось загрузить результат');

      await page.clock.fastForward(pollIntervalMs);
      await sees(page, profText.headline);
      await sees(page, profText.professorSummary);
      if (mock.getResultCalls() < 3) throw new Error('The poll did not continue after the failure');
    },
  );

// Ids are what `--only=` takes; verify:gates mutations name the scenario that must catch them.
const studentScenarios = {
  'standard-ai': standardAiAnalysis,
  'polus-prof': polusProfOrientation,
  'standard-prof': standardProfOrientation,
  'no-result': honestNoResult,
  'stale-chunk': staleChunk,
  'poll-failure': failedResultPoll,
};

export const studentScenarioIds = Object.keys(studentScenarios);

export const runStudentResultScenarios = async (harness, only = null) => {
  const unknown = (only ?? []).filter((id) => !studentScenarioIds.includes(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown student scenario: ${unknown.join(', ')}`);
  }

  for (const [id, run] of Object.entries(studentScenarios)) {
    if (!only || only.includes(id)) await run(harness);
  }
};
