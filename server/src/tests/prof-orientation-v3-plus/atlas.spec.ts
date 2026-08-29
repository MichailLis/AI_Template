import { ProfessionAtlasClientService } from '../../app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../../prisma.service';
import { ProfOrientationAtlasService } from './atlas';
import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from './types';
import type { ProfOrientationSummary } from './types';
describe('ProfOrientationAtlasService', () => {
  const settingsService = {
    getProfessionAtlasConnection: jest.fn(),
  };
  const atlasClient = {
    findProfessions: jest.fn(),
    getProfession: jest.fn(),
    findEnterprises: jest.fn(),
    findEvents: jest.fn(),
    findInstitutions: jest.fn(),
  };
  const prisma = {
    testStudentAnalysis: {
      update: jest.fn(),
    },
  };
  const createService = () =>
    new ProfOrientationAtlasService(
      prisma as unknown as PrismaService,
      settingsService as unknown as ProfessionAtlasSettingsService,
      atlasClient as unknown as ProfessionAtlasClientService,
    );
  const createSummary = (): ProfOrientationSummary =>
    ({
      resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
      primaryDirection: {
        id: 'A1',
        name: '3D-моделирование',
        professions: [{ code: 'A1-1', title: 'Инженер-конструктор', type: 'core' }],
      },
      secondaryDirection: {
        id: 'A2',
        name: '3D-печать',
        professions: [{ code: 'A2-1', title: 'Инженер по 3D-печати', type: 'core' }],
      },
      topDirections: [],
      llm: { status: 'pending' },
    }) as unknown as ProfOrientationSummary;
  const createProfession = (title: string, slug: string) => ({
    title,
    slug,
    summary: `${title} summary`,
    description: `${title} description`,
    demandLevel: 'high',
    industry: { name: 'Машиностроение' },
    municipality: { name: 'Казань' },
    skills: [{ name: 'CAD' }],
    educationPrograms: [
      {
        title: 'Технология машиностроения',
        institution: {
          name: `Колледж ${title}`,
          slug: `college-${slug}`,
          municipality: { name: 'Казань' },
        },
      },
    ],
  });
  beforeEach(() => {
    jest.clearAllMocks();
    settingsService.getProfessionAtlasConnection.mockResolvedValue({
      publicUrl: 'https://atlas.example',
      apiUrl: 'https://atlas.example/api-backend',
    });
    atlasClient.findInstitutions.mockResolvedValue([]);
  });
  it('uses normalized exact title matching and reports duplicates in coverage', async () => {
    atlasClient.findProfessions.mockImplementation(
      (_apiUrl: string, params: { q?: string; pageSize?: number }) => {
        if (!params.q) {
          return Promise.resolve([]);
        }
        if (params.q === 'Инженер-конструктор') {
          return Promise.resolve([
            { title: ' инженер-конструктор ', slug: 'engineer-designer' },
            { title: 'Инженер-конструктор-стажер', slug: 'engineer-designer-junior' },
          ]);
        }
        if (params.q === 'Оператор трехмерной печати') {
          return Promise.resolve([
            { title: 'Оператор трёхмерной печати', slug: '3d-print-operator' },
          ]);
        }
        if (params.q === 'Инженер по 3D-печати') {
          return Promise.resolve([
            { title: 'Инженер по 3D-печати', slug: '3d-print-engineer-a' },
            { title: 'Инженер по 3D-печати', slug: '3d-print-engineer-b' },
          ]);
        }
        return Promise.resolve([]);
      },
    );
    const report = await createService().buildCoverageReport();
    expect(atlasClient.findProfessions).toHaveBeenCalledWith('https://atlas.example/api-backend', {
      pageSize: 1,
    });
    expect(report.status).toBe('partial');
    expect(report.items.find((item) => item.title === 'Инженер-конструктор')).toMatchObject({
      status: 'found',
    });
    expect(report.items.find((item) => item.title === 'Оператор трехмерной печати')).toMatchObject({
      status: 'found',
    });
    expect(report.items.find((item) => item.title === 'Инженер по 3D-печати')).toMatchObject({
      status: 'duplicate',
    });
    expect(report.duplicates).toContain('Инженер по 3D-печати');
  });
  it('builds an atlas block from matched professions and recommendations', async () => {
    const primaryProfession = createProfession('Инженер-конструктор', 'engineer-designer');
    const secondaryProfession = createProfession('Инженер по 3D-печати', '3d-print-engineer');
    atlasClient.findProfessions.mockImplementation((_apiUrl: string, params: { q?: string }) => {
      if (params.q === 'Инженер-конструктор') {
        return Promise.resolve([{ title: 'Инженер-конструктор', slug: 'engineer-designer' }]);
      }
      if (params.q === 'Инженер по 3D-печати') {
        return Promise.resolve([{ title: 'Инженер по 3D-печати', slug: '3d-print-engineer' }]);
      }
      return Promise.resolve([]);
    });
    atlasClient.getProfession.mockImplementation((_apiUrl: string, slug: string) =>
      Promise.resolve(slug === 'engineer-designer' ? primaryProfession : secondaryProfession),
    );
    atlasClient.findEnterprises.mockResolvedValue([
      {
        name: 'Завод будущего',
        slug: 'future-plant',
        summary: 'Производственная площадка',
        industry: 'Машиностроение',
        opportunities: [
          {
            title: 'Стажировка конструктора',
            description: 'Работа с инженерными моделями',
            professionSlug: 'engineer-designer',
          },
        ],
      },
    ]);
    atlasClient.findEvents.mockResolvedValue([
      {
        title: 'CAD-практикум для инженер-конструктор',
        slug: 'cad-practice',
        summary: 'Практика проектирования',
        audience: 'школьники',
        type: 'workshop',
        startsAt: '2026-06-20T10:00:00.000Z',
        location: 'Технопарк',
        municipality: { name: 'Казань' },
      },
      {
        title: 'Мир 3D-моделирования',
        slug: '3d-modeling-world',
        summary: 'Конкурс цифровых моделей',
        audience: '3D-моделирование',
        type: 'olympiad',
        startsAt: '2026-07-20T10:00:00.000Z',
        location: 'Онлайн',
        municipality: null,
      },
    ]);
    const summary = await createService().enrichSummary(createSummary());
    expect(summary.atlas).toMatchObject({
      status: 'ready',
      professions: [
        {
          title: 'Инженер-конструктор',
          url: 'https://atlas.example/professions/engineer-designer',
        },
        {
          title: 'Инженер по 3D-печати',
          url: 'https://atlas.example/professions/3d-print-engineer',
        },
      ],
      enterprises: [
        {
          title: 'Завод будущего',
          url: 'https://atlas.example/enterprises#enterprise-future-plant',
        },
      ],
      events: [
        {
          title: 'CAD-практикум для инженер-конструктор',
          url: 'https://atlas.example/events#event-cad-practice',
        },
        {
          title: 'Мир 3D-моделирования',
          url: 'https://atlas.example/events#event-3d-modeling-world',
        },
      ],
    });
    expect(summary.atlas?.institutions).toHaveLength(2);
  });
  it('adds relevant institution search matches instead of only first direct programs', async () => {
    const primaryProfession = {
      ...createProfession('Инженер-конструктор', 'engineer-designer'),
      industry: { name: 'Цифровое проектирование' },
      educationPrograms: [
        {
          title: 'Конструкторско-технологическое обеспечение машиностроительных производств',
          institution: {
            name: 'Филиал САФУ в г. Северодвинске',
            slug: 'safu-severodvinsk-branch',
            municipality: { name: 'Северодвинск' },
          },
        },
      ],
    };
    const secondaryProfession = {
      ...createProfession('Техник-конструктор', 'technician-designer'),
      educationPrograms: [
        {
          title: 'Технология машиностроения',
          institution: {
            name: 'Технический колледж филиала САФУ',
            slug: 'safu-technical-college',
            municipality: { name: 'Северодвинск' },
          },
        },
        {
          title: 'Технология машиностроения',
          institution: {
            name: 'Технический колледж филиала САФУ',
            slug: 'safu-technical-college',
            municipality: { name: 'Северодвинск' },
          },
        },
        {
          title: 'Технология машиностроения',
          institution: {
            name: 'Технический колледж филиала САФУ',
            slug: 'safu-technical-college',
            municipality: { name: 'Северодвинск' },
          },
        },
      ],
    };
    atlasClient.findProfessions.mockImplementation((_apiUrl: string, params: { q?: string }) => {
      if (params.q === 'Инженер-конструктор') {
        return Promise.resolve([{ title: 'Инженер-конструктор', slug: 'engineer-designer' }]);
      }
      if (params.q === 'Техник-конструктор') {
        return Promise.resolve([{ title: 'Техник-конструктор', slug: 'technician-designer' }]);
      }
      return Promise.resolve([]);
    });
    atlasClient.getProfession.mockImplementation((_apiUrl: string, slug: string) =>
      Promise.resolve(slug === 'engineer-designer' ? primaryProfession : secondaryProfession),
    );
    atlasClient.findEnterprises.mockResolvedValue([]);
    atlasClient.findEvents.mockResolvedValue([]);
    atlasClient.findInstitutions.mockImplementation((_apiUrl: string, params: { q?: string }) => {
      if (params.q === 'инженер') {
        return Promise.resolve([
          {
            name: 'Широкий нерелевантный вуз',
            slug: 'broad-irrelevant-university',
            municipality: { name: 'Архангельск' },
            programsCount: 80,
            levels: [{ name: 'Высшее образование', slug: 'higher-education' }],
          },
          {
            name: 'Нерелевантный технический институт',
            slug: 'irrelevant-technical-institute',
            municipality: { name: 'Северодвинск' },
            programsCount: 50,
            levels: [{ name: 'Высшее образование', slug: 'higher-education' }],
          },
          {
            name: 'Нерелевантный колледж',
            slug: 'irrelevant-college',
            municipality: { name: 'Архангельск' },
            programsCount: 30,
            levels: [{ name: 'Среднее профессиональное образование', slug: 'spo' }],
          },
          {
            name: 'Еще один вуз',
            slug: 'another-university',
            municipality: { name: 'Архангельск' },
            programsCount: 40,
            levels: [{ name: 'Высшее образование', slug: 'higher-education' }],
          },
          {
            name: 'ФГАОУ ВО «Северный (Арктический) федеральный университет»',
            slug: 'safu',
            municipality: { name: 'Архангельск' },
            programsCount: 179,
            levels: [{ name: 'Высшее образование', slug: 'higher-education' }],
          },
        ]);
      }
      if (params.q === 'проектирование') {
        return Promise.resolve([
          {
            name: 'Филиал САФУ в г. Северодвинске',
            slug: 'safu-severodvinsk-branch',
            municipality: { name: 'Северодвинск' },
            programsCount: 28,
            levels: [{ name: 'Высшее образование', slug: 'higher-education' }],
          },
          {
            name: 'ФГАОУ ВО «Северный (Арктический) федеральный университет»',
            slug: 'safu',
            municipality: { name: 'Архангельск' },
            programsCount: 179,
            levels: [{ name: 'Высшее образование', slug: 'higher-education' }],
          },
        ]);
      }
      return Promise.resolve([]);
    });
    const summary = await createService().enrichSummary({
      ...createSummary(),
      primaryDirection: {
        ...createSummary().primaryDirection,
        professions: [{ code: 'A1-1', title: 'Инженер-конструктор', type: 'core' }],
        resultCard: {
          learn: [
            'основы черчения',
            'материаловедение',
            'основы машиностроения',
            'измерительный инструмент',
          ],
        },
      },
      secondaryDirection: {
        ...createSummary().secondaryDirection,
        professions: [{ code: 'A1-2', title: 'Техник-конструктор', type: 'core' }],
      },
    } as unknown as ProfOrientationSummary);
    expect(summary.atlas?.institutions.map((institution) => institution.title)).toEqual([
      'ФГАОУ ВО «Северный (Арктический) федеральный университет»',
      'Филиал САФУ в г. Северодвинске',
    ]);
    expect(summary.atlas?.institutions.map((institution) => institution.title)).not.toContain(
      'Широкий нерелевантный вуз',
    );
  });
  it('returns unavailable atlas status when Atlas API fails', async () => {
    atlasClient.findProfessions.mockRejectedValue(new Error('Atlas is down'));
    const summary = await createService().enrichSummary(createSummary());
    expect(summary.atlas).toMatchObject({
      status: 'unavailable',
      errorMessage: 'Atlas is down',
      professions: [],
      enterprises: [],
      events: [],
      institutions: [],
    });
  });
});
