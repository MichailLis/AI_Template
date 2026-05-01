require('dotenv/config');

const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createHash } = require('node:crypto');
const { Pool } = require('pg');

const DEMO_TOPIC_SLUGS = ['demo-career-orientation', 'demo-soft-skills', 'demo-archived-topic'];
const DEMO_ORGANIZATION_NAMES = ['Демо лицей №42', 'Демо колледж цифровых профессий'];
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const normalizeStudentIdentityPart = (value) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 300);

const buildStudentKeyHash = (input) => {
  const fingerprint = [
    normalizeStudentIdentityPart(input.studentName),
    normalizeStudentIdentityPart(input.studentLastInitial),
    normalizeStudentIdentityPart(input.studentMiddleInitial),
    normalizeStudentIdentityPart(input.educationOrganization),
    normalizeStudentIdentityPart(input.groupOrClass),
  ].join('|');

  return createHash('sha256').update(fingerprint).digest('hex');
};

const createQuestion = async (tx, versionId, question) => {
  const createdQuestion = await tx.testQuestion.create({
    data: {
      versionId,
      type: question.type,
      title: question.title,
      description: question.description ?? null,
      required: question.required ?? true,
      order: question.order,
      ...(question.settings !== undefined ? { settings: question.settings } : {}),
    },
  });

  if (question.options?.length) {
    await tx.testQuestionOption.createMany({
      data: question.options.map((option, index) => ({
        questionId: createdQuestion.id,
        label: option.label,
        value: option.value,
        weight: option.weight,
        order: index + 1,
      })),
    });
  }

  if (question.sliderBands?.length) {
    await tx.testQuestionSliderBand.createMany({
      data: question.sliderBands.map((band, index) => ({
        questionId: createdQuestion.id,
        minValue: band.minValue,
        maxValue: band.maxValue,
        label: band.label,
        weight: band.weight,
        order: index + 1,
      })),
    });
  }

  return createdQuestion;
};

const createQuestions = async (tx, versionId, questions) => {
  const createdQuestions = [];

  for (const question of questions) {
    createdQuestions.push(await createQuestion(tx, versionId, question));
  }

  return createdQuestions;
};

const createTopicWithVersions = async (tx, topic) => {
  const createdTopic = await tx.testTopic.create({
    data: {
      slug: topic.slug,
      archivedAt: topic.archivedAt ?? null,
    },
  });

  const publishedVersion = topic.published
    ? await tx.testTopicVersion.create({
        data: {
          topicId: createdTopic.id,
          versionNumber: 1,
          status: 'PUBLISHED',
          title: topic.published.title,
          description: topic.published.description,
        },
      })
    : null;

  if (publishedVersion) {
    await createQuestions(tx, publishedVersion.id, topic.published.questions);
  }

  const draftVersion = await tx.testTopicVersion.create({
    data: {
      topicId: createdTopic.id,
      versionNumber: publishedVersion ? 2 : 1,
      status: 'DRAFT',
      title: topic.draft.title,
      description: topic.draft.description,
    },
  });

  await createQuestions(tx, draftVersion.id, topic.draft.questions);

  await tx.testTopic.update({
    where: { id: createdTopic.id },
    data: {
      activeDraftVersionId: draftVersion.id,
      activePublishedVersionId: publishedVersion?.id ?? null,
    },
  });

  return {
    topicId: createdTopic.id,
    draftVersionId: draftVersion.id,
    publishedVersionId: publishedVersion?.id ?? null,
  };
};

const careerQuestions = [
  {
    type: 'SINGLE_CHOICE',
    title: 'Что вам больше всего нравится делать?',
    description: 'Выберите один вариант, который ближе всего к вашему интересу.',
    order: 1,
    options: [
      { label: 'Исследовать и анализировать данные', value: 'research', weight: 4 },
      { label: 'Создавать визуальные материалы', value: 'create', weight: 3 },
      { label: 'Помогать людям и объяснять', value: 'help', weight: 5 },
      { label: 'Собирать и настраивать системы', value: 'build', weight: 4 },
    ],
  },
  {
    type: 'MULTI_CHOICE',
    title: 'Какие форматы работы вам комфортны?',
    description: 'Можно выбрать несколько вариантов.',
    order: 2,
    options: [
      { label: 'Командные обсуждения', value: 'team', weight: 3 },
      { label: 'Индивидуальные задачи', value: 'solo', weight: 2 },
      { label: 'Публичные выступления', value: 'presenting', weight: 4 },
      { label: 'Работа с техникой', value: 'technical', weight: 4 },
    ],
  },
  {
    type: 'SLIDER',
    title: 'Насколько комфортно общаться с незнакомыми людьми?',
    description: 'Оцените по шкале от 1 до 10.',
    order: 3,
    settings: { min: 1, max: 10, step: 1 },
    sliderBands: [
      { minValue: 1, maxValue: 3, label: 'Лучше письменный формат', weight: 1 },
      { minValue: 4, maxValue: 7, label: 'Комфортно при подготовке', weight: 3 },
      { minValue: 8, maxValue: 10, label: 'Легко знакомлюсь и общаюсь', weight: 5 },
    ],
  },
  {
    type: 'OPEN_TEXT',
    title: 'Опишите проект, которым вы гордитесь',
    description: 'Коротко расскажите, что вы сделали и почему это важно.',
    order: 4,
  },
];

const softSkillsQuestions = [
  {
    type: 'SINGLE_CHOICE',
    title: 'Как вы реагируете на срочные изменения в задаче?',
    description: 'Выберите наиболее частый сценарий.',
    order: 1,
    options: [
      { label: 'Сразу уточняю приоритеты', value: 'clarify', weight: 5 },
      { label: 'Продолжаю старый план', value: 'old-plan', weight: 1 },
      { label: 'Беру паузу и собираю факты', value: 'facts', weight: 4 },
    ],
  },
  {
    type: 'OPEN_TEXT',
    title: 'Пример обратной связи',
    description: 'Напишите, как вы бы дали конструктивную обратную связь однокурснику.',
    order: 2,
  },
];

const createAttempt = async (tx, input) => {
  const studentKeyHash = buildStudentKeyHash(input.student);
  const attempt = await tx.testStudentAttempt.create({
    data: {
      publicLinkId: input.publicLinkId,
      topicVersionId: input.topicVersionId,
      attemptNumber: input.attemptNumber,
      status: input.status,
      studentName: input.student.studentName,
      studentLastInitial: input.student.studentLastInitial,
      studentMiddleInitial: input.student.studentMiddleInitial,
      educationOrganization: input.student.educationOrganization,
      groupOrClass: input.student.groupOrClass,
      studentKeyHash,
      consentAcceptedAt: input.startedAt,
      consentVersion: 'demo-v1',
      consentTextSnapshot: 'Даю согласие на обработку демо-данных для тестирования интерфейса.',
      resumeToken: input.resumeToken,
      startedAt: input.startedAt,
      expiresAt: input.expiresAt ?? null,
      finishedAt: input.finishedAt ?? null,
    },
  });

  for (const answer of input.answers ?? []) {
    await tx.testStudentAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: answer.question.id,
        questionTypeSnapshot: answer.question.type,
        questionTitleSnapshot: answer.question.title,
        answerPayload: answer.answerPayload,
      },
    });
  }

  if (input.analysis) {
    await tx.testStudentAnalysis.create({
      data: {
        attemptId: attempt.id,
        providerMode: input.analysis.providerMode,
        status: input.analysis.status,
        summary: input.analysis.summary,
        rawText: input.analysis.rawText,
        errorMessage: input.analysis.errorMessage ?? null,
        generatedAt: input.analysis.generatedAt ?? null,
      },
    });
  }

  return attempt;
};

const main = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed demo data.');
  }

  const hashedAdminPassword = await argon2.hash('admin');
  const hashedDemoPassword = await argon2.hash('password123');

  await prisma.$transaction(async (tx) => {
    await tx.testTopic.deleteMany({
      where: {
        slug: {
          in: DEMO_TOPIC_SLUGS,
        },
      },
    });

    await tx.educationOrganization.deleteMany({
      where: {
        name: {
          in: DEMO_ORGANIZATION_NAMES,
        },
      },
    });

    const admin = await tx.user.upsert({
      where: { email: 'admin@admin.admin' },
      create: {
        email: 'admin@admin.admin',
        name: 'Администратор демо',
        password: hashedAdminPassword,
        role: 'ADMIN',
      },
      update: {
        name: 'Администратор демо',
        password: hashedAdminPassword,
        role: 'ADMIN',
      },
    });

    await Promise.all([
      tx.user.upsert({
        where: { email: 'manager@example.com' },
        create: {
          email: 'manager@example.com',
          name: 'Анна Методист',
          password: hashedDemoPassword,
          role: 'ADMIN',
        },
        update: {
          name: 'Анна Методист',
          password: hashedDemoPassword,
          role: 'ADMIN',
        },
      }),
      tx.user.upsert({
        where: { email: 'student@example.com' },
        create: {
          email: 'student@example.com',
          name: 'Иван Студент',
          password: hashedDemoPassword,
          role: 'USER',
        },
        update: {
          name: 'Иван Студент',
          password: hashedDemoPassword,
          role: 'USER',
        },
      }),
      tx.user.upsert({
        where: { email: 'teacher@example.com' },
        create: {
          email: 'teacher@example.com',
          name: 'Ольга Преподаватель',
          password: hashedDemoPassword,
          role: 'USER',
        },
        update: {
          name: 'Ольга Преподаватель',
          password: hashedDemoPassword,
          role: 'USER',
        },
      }),
    ]);

    const lyceum = await tx.educationOrganization.create({
      data: {
        name: 'Демо лицей №42',
        isActive: true,
        groupValidationMode: 'HINT',
        groupValidationPattern: '^(9|10|11)[А-ЯA-Z]$',
        groupValidationExample: '10А',
        groupValidationHint: 'Введите класс в формате 10А или 11Б.',
      },
    });

    const college = await tx.educationOrganization.create({
      data: {
        name: 'Демо колледж цифровых профессий',
        isActive: true,
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^[А-ЯA-Z]{2,5}-\\d{2}$',
        groupValidationExample: 'ИС-21',
        groupValidationHint: 'Введите группу в формате ИС-21.',
      },
    });

    const careerTopic = await createTopicWithVersions(tx, {
      slug: 'demo-career-orientation',
      published: {
        title: 'Демо: профориентационный тест',
        description: 'Опубликованная версия для публичной ссылки и статистики.',
        questions: careerQuestions,
      },
      draft: {
        title: 'Демо: профориентационный тест — черновик',
        description: 'Черновик показывает, как выглядит редактируемая версия с вопросами.',
        questions: [
          ...careerQuestions,
          {
            type: 'OPEN_TEXT',
            title: 'Какая профессия кажется вам интересной сейчас?',
            description: 'Этот вопрос есть только в черновике.',
            order: 5,
            required: false,
          },
        ],
      },
    });

    await createTopicWithVersions(tx, {
      slug: 'demo-soft-skills',
      draft: {
        title: 'Демо: soft skills',
        description: 'Черновик без публикации для проверки сценария подготовки теста.',
        questions: softSkillsQuestions,
      },
    });

    await createTopicWithVersions(tx, {
      slug: 'demo-archived-topic',
      archivedAt: new Date('2026-04-20T09:00:00.000Z'),
      draft: {
        title: 'Демо: архивный тест',
        description: 'Архивная тема для проверки фильтра архивных тестов.',
        questions: softSkillsQuestions,
      },
    });

    const activeLink = await tx.testPublicLink.create({
      data: {
        topicVersionId: careerTopic.publishedVersionId,
        educationOrganizationId: lyceum.id,
        shortCode: 'DEMO2026',
        isActive: true,
        maxAttemptsPerStudent: 3,
        timeLimitMinutes: 45,
        allowResume: true,
        consentVersion: 'demo-v1',
        consentTextSnapshot: 'Даю согласие на обработку демо-данных для тестирования интерфейса.',
        createdByUserId: admin.id,
      },
    });

    await tx.testPublicLink.create({
      data: {
        topicVersionId: careerTopic.publishedVersionId,
        educationOrganizationId: college.id,
        shortCode: 'COLLEGE1',
        isActive: false,
        maxAttemptsPerStudent: 1,
        timeLimitMinutes: 30,
        allowResume: false,
        consentVersion: 'demo-v1',
        consentTextSnapshot: 'Демо-согласие для неактивной ссылки.',
        createdByUserId: admin.id,
      },
    });

    await tx.testPublicLink.create({
      data: {
        topicVersionId: careerTopic.publishedVersionId,
        shortCode: 'ARCHIVE1',
        isActive: false,
        maxAttemptsPerStudent: 1,
        allowResume: true,
        consentVersion: 'demo-v1',
        consentTextSnapshot: 'Демо-согласие для архивной ссылки.',
        createdByUserId: admin.id,
        archivedAt: new Date('2026-04-25T12:00:00.000Z'),
      },
    });

    const questions = await tx.testQuestion.findMany({
      where: { versionId: careerTopic.publishedVersionId },
      orderBy: { order: 'asc' },
    });

    await createAttempt(tx, {
      publicLinkId: activeLink.id,
      topicVersionId: careerTopic.publishedVersionId,
      attemptNumber: 1,
      status: 'COMPLETED',
      student: {
        studentName: 'Иван',
        studentLastInitial: 'П',
        studentMiddleInitial: 'С',
        educationOrganization: 'Демо лицей №42',
        groupOrClass: '10А',
      },
      resumeToken: 'demo-token-completed-ivan',
      startedAt: new Date('2026-04-28T09:10:00.000Z'),
      finishedAt: new Date('2026-04-28T09:32:00.000Z'),
      answers: [
        { question: questions[0], answerPayload: 'research' },
        { question: questions[1], answerPayload: ['team', 'technical'] },
        { question: questions[2], answerPayload: 8 },
        {
          question: questions[3],
          answerPayload: 'Собрал прототип приложения для школьного кружка и показал его группе.',
        },
      ],
      analysis: {
        providerMode: 'STUB',
        status: 'READY',
        summary: {
          mode: 'demo',
          archetype: 'Исследователь-практик',
          completionRate: 100,
          recommendedTracks: ['аналитика данных', 'продуктовая разработка'],
        },
        rawText:
          'Демо-анализ готов: студент уверенно выбирает исследовательские и технические задачи.',
        generatedAt: new Date('2026-04-28T09:32:30.000Z'),
      },
    });

    await createAttempt(tx, {
      publicLinkId: activeLink.id,
      topicVersionId: careerTopic.publishedVersionId,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      student: {
        studentName: 'Мария',
        studentLastInitial: 'С',
        studentMiddleInitial: 'А',
        educationOrganization: 'Демо лицей №42',
        groupOrClass: '11Б',
      },
      resumeToken: 'demo-token-progress-maria',
      startedAt: new Date('2026-04-29T12:00:00.000Z'),
      expiresAt: new Date('2026-05-02T12:45:00.000Z'),
      answers: [
        { question: questions[0], answerPayload: 'help' },
        { question: questions[2], answerPayload: 6 },
      ],
    });

    await createAttempt(tx, {
      publicLinkId: activeLink.id,
      topicVersionId: careerTopic.publishedVersionId,
      attemptNumber: 1,
      status: 'EXPIRED',
      student: {
        studentName: 'Артём',
        studentLastInitial: 'К',
        studentMiddleInitial: 'И',
        educationOrganization: 'Демо лицей №42',
        groupOrClass: '9В',
      },
      resumeToken: 'demo-token-expired-artem',
      startedAt: new Date('2026-04-27T14:00:00.000Z'),
      expiresAt: new Date('2026-04-27T14:45:00.000Z'),
      finishedAt: new Date('2026-04-27T14:45:00.000Z'),
      answers: [{ question: questions[0], answerPayload: 'create' }],
      analysis: {
        providerMode: 'STUB',
        status: 'PENDING',
        summary: null,
        rawText: null,
      },
    });
  });

  const [users, topics, publicLinks, attempts] = await Promise.all([
    prisma.user.count(),
    prisma.testTopic.count(),
    prisma.testPublicLink.count(),
    prisma.testStudentAttempt.count(),
  ]);

  console.log('Demo data seeded successfully.');
  console.log(
    `Users: ${users}, topics: ${topics}, public links: ${publicLinks}, attempts: ${attempts}`,
  );
  console.log('Admin login: admin@admin.admin / admin');
  console.log('Demo user password: password123');
  console.log('Public test URL: http://localhost:5173/t/DEMO2026');
};

main()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
