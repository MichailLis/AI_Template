import { useEffect, useState } from 'react';

import { getRemainingSeconds } from './public-test-run-timer.helpers';

const COUNTDOWN_TICK_MS = 1_000;

export function usePublicTestRunCountdown(expiresAt: string | null) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, COUNTDOWN_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAt]);

  return getRemainingSeconds(expiresAt, nowMs);
}
