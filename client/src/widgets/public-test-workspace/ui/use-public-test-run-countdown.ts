import { useEffect, useRef, useState } from 'react';

import { getRemainingSeconds } from './public-test-run-timer.helpers';

const COUNTDOWN_TICK_MS = 1_000;

const computeClockSkewMs = (serverTime?: string | null) => {
  if (!serverTime) {
    return 0;
  }
  const serverMs = Date.parse(serverTime);
  return Number.isFinite(serverMs) ? Date.now() - serverMs : 0;
};

export function usePublicTestRunCountdown(
  expiresAt: string | null,
  serverTime?: string | null,
  onExpire?: () => void,
) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [prevServerTime, setPrevServerTime] = useState(serverTime);
  const [clockSkewMs, setClockSkewMs] = useState(() => computeClockSkewMs(serverTime));

  if (serverTime !== prevServerTime) {
    setPrevServerTime(serverTime);
    setClockSkewMs(computeClockSkewMs(serverTime));
  }
  const hasCalledExpireRef = useRef(false);

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

  const remainingSeconds = getRemainingSeconds(expiresAt, nowMs, clockSkewMs);

  useEffect(() => {
    if (remainingSeconds === 0 && expiresAt && onExpire && !hasCalledExpireRef.current) {
      hasCalledExpireRef.current = true;
      onExpire();
    }
    if (remainingSeconds !== null && remainingSeconds > 0) {
      hasCalledExpireRef.current = false;
    }
  }, [remainingSeconds, expiresAt, onExpire]);

  return remainingSeconds;
}
