import { Injectable } from '@nestjs/common';
import type { Prisma, TestStudentAnalysis, TestStudentAttempt } from '@prisma/client';

interface StubAnalysisInput {
  attemptId: number;
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
}

@Injectable()
export class TestsAnalysisService {
  upsertStubAnalysis(
    tx: Prisma.TransactionClient,
    input: StubAnalysisInput,
  ): Promise<TestStudentAnalysis> {
    const now = new Date();
    const completionRate =
      input.totalQuestionsCount > 0
        ? Math.round((input.answeredQuestionsCount / input.totalQuestionsCount) * 100)
        : 0;

    const summary = {
      mode: 'stub',
      answeredQuestionsCount: input.answeredQuestionsCount,
      totalQuestionsCount: input.totalQuestionsCount,
      completionRate,
      note: 'LLM analysis is not enabled yet. This is a deterministic placeholder.',
    };

    return tx.testStudentAnalysis.upsert({
      where: {
        attemptId: input.attemptId,
      },
      create: {
        attemptId: input.attemptId,
        providerMode: 'STUB',
        status: 'READY',
        summary,
        rawText: 'Stub analysis is ready. LLM integration will be added in the next iteration.',
        generatedAt: now,
      },
      update: {
        providerMode: 'STUB',
        status: 'READY',
        summary,
        rawText: 'Stub analysis is ready. LLM integration will be added in the next iteration.',
        errorMessage: null,
        generatedAt: now,
      },
    });
  }

  toPublicAnalysisResponse(analysis: TestStudentAnalysis | null) {
    if (!analysis) {
      return {
        providerMode: 'STUB' as const,
        status: 'PENDING' as const,
        summary: null,
        rawText: null,
        errorMessage: null,
        generatedAt: null,
      };
    }

    return {
      providerMode: analysis.providerMode,
      status: analysis.status,
      summary: analysis.summary,
      rawText: analysis.rawText,
      errorMessage: analysis.errorMessage,
      generatedAt: analysis.generatedAt ? analysis.generatedAt.toISOString() : null,
    };
  }

  toAttemptStatus(attempt: Pick<TestStudentAttempt, 'status' | 'finishedAt'>) {
    if (attempt.status === 'COMPLETED') {
      return 'COMPLETED' as const;
    }

    if (attempt.status === 'EXPIRED') {
      return 'EXPIRED' as const;
    }

    if (attempt.status === 'ABANDONED') {
      return 'ABANDONED' as const;
    }

    if (attempt.finishedAt) {
      return 'COMPLETED' as const;
    }

    return 'IN_PROGRESS' as const;
  }
}
