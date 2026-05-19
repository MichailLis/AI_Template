import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';

import { PublicTestResultWorkspace } from './public-test-result-workspace';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ sessionToken: 'session-token' }),
}));

vi.mock('@/shared/api/generated/tests-public/tests-public', () => ({
  useTestsPublicControllerGetSessionResult: vi.fn(),
}));

vi.mock('@/features/tests', () => ({
  parseAnalysisResult: () => null,
}));

describe('PublicTestResultWorkspace', () => {
  it('shows a full processing screen while analysis is still pending', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'STANDARD',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: null,
        analysis: {
          providerMode: 'LLM',
          status: 'PENDING',
          summary: null,
          rawText: null,
          errorMessage: null,
          generatedAt: null,
        },
      },
    } as never);

    render(<PublicTestResultWorkspace />);

    expect(screen.getByRole('heading', { name: /формируем отчет/i })).toBeInTheDocument();
    expect(screen.getByText(/может занять около минуты/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /результат теста/i })).not.toBeInTheDocument();
  });

  it('shows the configured profession atlas link with student-facing explanation', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'STANDARD',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: 'https://atlas.example/professions',
        analysis: {
          providerMode: 'STUB',
          status: 'READY',
          summary: null,
          rawText: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    render(<PublicTestResultWorkspace />);

    expect(screen.getByText(/ознакомиться с профессиями и спросом на них/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть Атлас профессий' })).toHaveAttribute(
      'href',
      'https://atlas.example/professions',
    );
  });

  it('renders the Polus result template when the session uses POLUS', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'POLUS',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: null,
        analysis: {
          providerMode: 'STUB',
          status: 'READY',
          summary: null,
          rawText: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    render(<PublicTestResultWorkspace />);

    expect(screen.getByText(/Профессор Полюс говорит/i)).toBeInTheDocument();
    expect(screen.getByText(/Персональная карта развития/i)).toBeInTheDocument();
  });
});
