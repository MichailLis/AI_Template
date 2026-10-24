import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicTestAnalysisProcessingScreen } from './public-test-analysis-processing-screen';

const renderClip = (phase: 'processing' | 'ready') =>
  render(
    <PublicTestAnalysisProcessingScreen startedAt={null} variant="polus" phase={phase} />,
  ).container.querySelector('video');

describe('PublicTestAnalysisProcessingScreen professor clip', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays a muted inline loop with the still as poster', () => {
    const video = renderClip('processing');

    expect(video).toHaveAttribute('src', expect.stringContaining('professor-polus-thinking.mp4'));
    expect(video).toHaveAttribute('poster', expect.stringContaining('professor-polus'));
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveProperty('muted', true);
    expect(video).toHaveProperty('loop', true);
    expect(video).toHaveProperty('autoplay', true);
  });

  it('stays on the poster when the student prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    expect(renderClip('processing')).toHaveProperty('autoplay', false);
  });

  it('shows the still image, not the clip, once the report is ready', () => {
    expect(renderClip('ready')).toBeNull();
  });
});
