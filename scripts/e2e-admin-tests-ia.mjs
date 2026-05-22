#!/usr/bin/env node
/**
 * Deterministic UI E2E Harness for Admin Tests Module
 *
 * Standalone script that starts client preview, seeds auth state,
 * mocks API endpoints, and runs navigation scenarios.
 */

import { chromium } from 'playwright';

import { spawnNpm, spawnSyncNpm } from './lib/npm-runner.mjs';
import { getProcessTreeSpawnOptions, stopProcessTree } from './lib/process-tree.mjs';

const port = '4173';
const targetUrl = `http://127.0.0.1:${port}/`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Deterministic fixtures for mock API responses
const mockTopicList = {
  topics: [
    {
      id: 1,
      slug: 'javascript-basics',
      draftVersionNumber: 1,
      draftTitle: 'JavaScript Basics',
      draftQuestionCount: 5,
      publishedVersionNumber: null,
      publishedTitle: null,
      updatedAt: '2026-02-25T10:00:00Z',
    },
    {
      id: 2,
      slug: 'react-fundamentals',
      draftVersionNumber: 2,
      draftTitle: 'React Fundamentals',
      draftQuestionCount: 8,
      publishedVersionNumber: 1,
      publishedTitle: 'React Fundamentals v1',
      updatedAt: '2026-02-24T15:30:00Z',
    },
  ],
};

const mockTopicDetail = {
  topicId: 1,
  slug: 'javascript-basics',
  draft: {
    id: 1,
    versionNumber: 1,
    title: 'JavaScript Basics',
    description: 'Test your knowledge of JavaScript fundamentals',
    questions: [
      {
        id: 1,
        type: 'OPEN_TEXT',
        title: 'What is a closure?',
        description: null,
        required: true,
        order: 0,
        settings: null,
        options: [],
        sliderBands: [],
      },
      {
        id: 2,
        type: 'SINGLE_CHOICE',
        title: 'Which is correct?',
        description: null,
        required: true,
        order: 1,
        settings: null,
        options: [
          { id: 1, label: 'Option A', value: 'a', weight: 0, order: 0 },
          { id: 2, label: 'Option B', value: 'b', weight: 1, order: 1 },
        ],
        sliderBands: [],
      },
    ],
  },
  published: null,
};

const waitForClient = async (url, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('<div id="root"></div>')) {
          return;
        }
      }
    } catch {
      // ignore until timeout
    }

    await sleep(500);
  }

  throw new Error(`Client not ready: ${url}`);
};

const buildClient = async () => {
  console.log('Building client...');
  const buildProcess = spawnSyncNpm(['run', 'build', '--prefix', 'client'], {
    stdio: 'inherit',
  });

  if (buildProcess.error) {
    throw buildProcess.error;
  }

  if (buildProcess.status !== 0) {
    throw new Error(`Client build failed with exit code ${buildProcess.status ?? 'unknown'}`);
  }

  console.log('✓ Build complete');
};

const startPreview = () => {
  console.log('Starting preview server...');

  const client = spawnNpm(
    [
      'run',
      'preview',
      '--prefix',
      'client',
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      port,
      '--strictPort',
    ],
    getProcessTreeSpawnOptions({
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );

  let clientLogs = '';
  client.stdout.on('data', (chunk) => {
    clientLogs += chunk.toString();
  });
  client.stderr.on('data', (chunk) => {
    clientLogs += chunk.toString();
  });

  return { client, logs: () => clientLogs };
};

const isExpectedMockedServerError = (message) =>
  message.includes('Failed to load resource: the server responded with a status of 500') &&
  message.includes('Internal Server Error');

const createCheckedPage = async (browser, scenarioName, options = {}) => {
  const page = await browser.newPage();
  const browserErrors = [];
  const allowConsoleError = options.allowConsoleError ?? (() => false);

  page.on('console', (message) => {
    const text = message.text();

    if (message.type() === 'error' && !allowConsoleError(text)) {
      browserErrors.push(`console.error: ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    browserErrors.push(`pageerror: ${error.message}`);
  });

  const assertNoBrowserErrors = () => {
    if (browserErrors.length === 0) return;

    throw new Error(`${scenarioName} browser errors:\n${browserErrors.join('\n')}`);
  };

  return { page, assertNoBrowserErrors };
};

const seedAuthState = async (page) => {
  console.log('Seeding auth state...');

  await page.goto('http://127.0.0.1:4173/');

  // Seed localStorage with auth state
  await page.evaluate(() => {
    const storage = window.localStorage;

    // Set auth-storage (Zustand persist)
    storage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: { id: 1, email: 'admin@example.com', name: 'Admin User' },
          isAuthenticated: true,
        },
        version: 0,
      }),
    );

    storage.setItem('accessToken', 'mock-access-token');
  });

  console.log('✓ Auth state seeded');
};

const setupRouteMocks = async (page, forceError = false) => {
  // Mock list endpoint
  await page.route('**/admin/tests**', async (route) => {
    const url = route.request().url();

    if (
      forceError &&
      url.includes('/admin/tests') &&
      !url.includes('/admin/tests/') &&
      !url.includes('detail')
    ) {
      // Force 500 on list endpoint for error scenario
      console.log('Mocking 500 error for /admin/tests');
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error', statusCode: 500 }),
      });
      return;
    }

    if (url.includes('/admin/tests/') && !url.includes('/admin/tests?')) {
      // Detail endpoint
      console.log('Mocking topic detail response');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTopicDetail),
      });
      return;
    }

    // List endpoint
    console.log('Mocking topic list response');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTopicList),
    });
  });
};

const runHappyPath = async (browser) => {
  console.log('\n=== RUNNING HAPPY PATH ===');

  const { page, assertNoBrowserErrors } = await createCheckedPage(browser, 'Happy path');

  try {
    // Setup mocks
    await setupRouteMocks(page, false);

    // Seed auth
    await seedAuthState(page);

    // Navigate to tests list
    console.log('1. Navigating to /admin/tests...');
    await page.goto('http://127.0.0.1:4173/admin/tests');

    // Wait for content to load
    await page.waitForTimeout(1000);
    const bodyContent = await page.textContent('body');
    const hasTopics =
      bodyContent.includes('JavaScript Basics') || bodyContent.includes('React Fundamentals');
    if (!hasTopics) {
      throw new Error('Topic list not visible after loading');
    }
    console.log('✓ Topic list loaded');

    // Navigate to topic detail
    console.log('2. Navigating to topic detail (/admin/tests/1)...');
    await page.goto('http://127.0.0.1:4173/admin/tests/1');
    await page.waitForTimeout(1000);

    const detailContent = await page.textContent('body');
    const hasDetail =
      detailContent.includes('JavaScript Basics') && detailContent.includes('What is a closure?');
    if (!hasDetail) {
      throw new Error('Topic detail not visible');
    }
    console.log('✓ Topic detail loaded');

    // Navigate to settings tab
    console.log('3. Navigating to settings tab...');
    await page.goto('http://127.0.0.1:4173/admin/tests/1/settings');
    await page.waitForTimeout(1000);

    const settingsContent = await page.textContent('body');
    const hasSettings = settingsContent.toLowerCase().includes('javascript basics');
    if (!hasSettings) {
      throw new Error('Settings page not visible');
    }
    console.log('✓ Settings tab loaded');

    // Take screenshot
    await page.screenshot({
      path: '.sisyphus/evidence/task-1-admin-tests-ia-happy.png',
      fullPage: true,
    });
    console.log('✓ Screenshot saved to .sisyphus/evidence/task-1-admin-tests-ia-happy.png');

    assertNoBrowserErrors();

    console.log('\n✅ HAPPY PATH PASSED');
  } finally {
    await page.close();
  }
};

const runErrorScenario = async (browser) => {
  console.log('\n=== RUNNING ERROR SCENARIO ===');

  const { page, assertNoBrowserErrors } = await createCheckedPage(browser, 'Error scenario', {
    allowConsoleError: isExpectedMockedServerError,
  });

  try {
    // Setup mocks with 500 error
    await setupRouteMocks(page, true);

    // Seed auth
    await seedAuthState(page);

    // Navigate to tests list (will get 500)
    console.log('1. Navigating to /admin/tests (expecting 500)...');
    await page.goto('http://127.0.0.1:4173/admin/tests');

    // Wait for error state to be visible
    await page.waitForTimeout(1000);

    // Check for error indicators (error text, toast, or fallback UI)
    const bodyContent = await page.textContent('body');
    const bodyLower = bodyContent.toLowerCase();
    const hasErrorState =
      bodyLower.includes('ошибка') ||
      bodyLower.includes('error') ||
      bodyLower.includes('500') ||
      bodyLower.includes('internal server error') ||
      bodyLower.includes('не удалось загрузить');

    console.log(`   Error indicators present: ${hasErrorState ? '✓' : '✗'}`);

    // Take screenshot of error state
    await page.screenshot({
      path: '.sisyphus/evidence/task-1-admin-tests-ia-error.png',
      fullPage: true,
    });
    console.log('✓ Screenshot saved to .sisyphus/evidence/task-1-admin-tests-ia-error.png');

    if (!hasErrorState) {
      throw new Error('No explicit error state detected in UI');
    }

    assertNoBrowserErrors();

    console.log('\n✅ ERROR SCENARIO PASSED (500 error simulated)');
  } finally {
    await page.close();
  }
};

const main = async () => {
  let previewProcess = null;
  let getPreviewLogs = () => '';

  try {
    // Step 1: Build current client assets
    await buildClient();

    // Step 2: Start preview
    const { client, logs } = startPreview();
    previewProcess = client;
    getPreviewLogs = logs;

    // Step 3: Wait for client to be ready
    await waitForClient(targetUrl, 30000);
    console.log('✓ Client ready at', targetUrl);

    // Step 4: Launch Playwright
    console.log('Launching Playwright...');
    const browser = await chromium.launch({ headless: true });

    try {
      // Step 5: Run happy path
      await runHappyPath(browser);

      // Step 6: Run error scenario
      await runErrorScenario(browser);

      console.log('\n✅ ALL SCENARIOS PASSED');
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('\n❌ SCRIPT FAILED:');
    console.error(error);

    const previewLogs = getPreviewLogs();
    if (previewLogs) {
      console.error('\n--- PREVIEW LOGS ---');
      console.error(previewLogs);
      console.error('--- END PREVIEW LOGS ---\n');
    }

    process.exit(1);
  } finally {
    if (previewProcess) {
      await stopProcessTree(previewProcess);
    }
  }
};

main();
