import { StreamableFile, type Type } from '@nestjs/common';

import { TestsAdminAnalyticsController } from '../reporting/admin-analytics.controller';
import { TestsAnalyticsExportService } from '../reporting/analytics-export.service';
import { TestsAnalyticsService } from '../reporting/analytics.service';
import {
  AdminTestAnalyticsQueryDto,
  AdminTestAnalyticsSummaryDto,
} from '../dto/tests-analytics.dto';
import { type Response } from 'express';

describe('TestsAdminAnalyticsController', () => {
  let controller: TestsAdminAnalyticsController;
  let analyticsServiceMock: {
    getSummary: jest.Mock;
  };
  let exportServiceMock: {
    toExcel: jest.Mock;
    toPdf: jest.Mock;
  };

  const setHeaderMock = jest.fn();
  const responseMock = {
    setHeader: setHeaderMock,
  } as unknown as Response;

  const createSummary = (): AdminTestAnalyticsSummaryDto =>
    ({
      topic: {
        topicId: 1,
        slug: 'test-topic',
        title: 'Test Topic',
        questionCount: 10,
        generatedAt: '2026-05-01T10:00:00.000Z',
      },
      filters: {
        scope: 'TOPIC',
        publicLinkId: null,
        linkStatus: 'ALL',
        dateFrom: null,
        dateTo: null,
      },
      coverage: {
        publicLinks: 1,
        attemptsTotal: 1,
        attemptsCompleted: 1,
        analysisReady: 1,
        analysisPending: 0,
        analysisFailed: 0,
        analysisMissing: 0,
        v3Results: 1,
      },
      directions: [],
      directionPairs: [],
      scoreAverages: [],
      profiles: [],
      confidence: {
        levels: [],
        gap: { value: 0, total: 0 },
        consistencyIndex: { value: 0, total: 0 },
        readinessTop: { value: 0, total: 0 },
      },
      flags: [],
      publicLinks: [],
      groups: [],
      demographics: {
        gender: [],
        ageRange: [],
        residence: [],
        educationLevel: [],
      },
      attempts: [],
    }) as unknown as AdminTestAnalyticsSummaryDto;

  beforeEach(() => {
    analyticsServiceMock = {
      getSummary: jest.fn(),
    };
    exportServiceMock = {
      toExcel: jest.fn(),
      toPdf: jest.fn(),
    };

    controller = new TestsAdminAnalyticsController(
      analyticsServiceMock as unknown as TestsAnalyticsService,
      exportServiceMock as unknown as TestsAnalyticsExportService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getSummary delegates to analytics service with filters', async () => {
    const query: AdminTestAnalyticsQueryDto = {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    };
    const summary = createSummary();
    analyticsServiceMock.getSummary.mockResolvedValue(summary);

    const result = await controller.getSummary(7, 11, query);

    expect(result).toEqual(summary);
    expect(analyticsServiceMock.getSummary).toHaveBeenCalledWith(7, 11, query);
  });

  it('keeps query DTO metadata for validation and coercion', () => {
    const assertQueryMetatype = (methodName: keyof TestsAdminAnalyticsController) => {
      const paramTypes = Reflect.getMetadata(
        'design:paramtypes',
        TestsAdminAnalyticsController.prototype,
        methodName,
      ) as Type<unknown>[];

      expect(paramTypes[2]).toBe(AdminTestAnalyticsQueryDto);
    };

    assertQueryMetatype('getSummary');
    assertQueryMetatype('exportXlsx');
    assertQueryMetatype('exportPdf');
  });

  it('exportXlsx calls analytics + excel service and returns StreamableFile with headers', async () => {
    const query: AdminTestAnalyticsQueryDto = {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    };
    const summary = createSummary();
    const buffer = Buffer.from('xlsx');
    analyticsServiceMock.getSummary.mockResolvedValue(summary);
    exportServiceMock.toExcel.mockResolvedValue(buffer);

    const result = await controller.exportXlsx(7, 22, query, responseMock);

    expect(analyticsServiceMock.getSummary).toHaveBeenCalledWith(7, 22, query);
    expect(exportServiceMock.toExcel).toHaveBeenCalledWith(summary);
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="test-analytics-22.xlsx"',
    );
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toMatchObject({
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="test-analytics-22.xlsx"',
    });
  });

  it('exportPdf calls analytics + pdf service and returns StreamableFile with headers', async () => {
    const query: AdminTestAnalyticsQueryDto = {
      scope: 'TOPIC',
      linkStatus: 'ALL',
    };
    const summary = createSummary();
    const buffer = Buffer.from('pdf');
    analyticsServiceMock.getSummary.mockResolvedValue(summary);
    exportServiceMock.toPdf.mockResolvedValue(buffer);

    const result = await controller.exportPdf(7, 33, query, responseMock);

    expect(analyticsServiceMock.getSummary).toHaveBeenCalledWith(7, 33, query);
    expect(exportServiceMock.toPdf).toHaveBeenCalledWith(summary);
    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="test-analytics-33.pdf"',
    );
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toMatchObject({
      type: 'application/pdf',
      disposition: 'attachment; filename="test-analytics-33.pdf"',
    });
  });
});
