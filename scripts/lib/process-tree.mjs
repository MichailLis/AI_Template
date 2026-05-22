import { spawnSync } from 'node:child_process';

export const getProcessTreeSpawnOptions = (options = {}) => ({
  ...options,
  detached: process.platform === 'win32' ? options.detached : (options.detached ?? true),
});

const isValidPid = (pid) => Number.isInteger(pid) && pid > 0;

const releaseChildHandles = (child) => {
  child.stdin?.destroy?.();
  child.stdout?.destroy?.();
  child.stderr?.destroy?.();
  child.unref?.();
};

const signalProcessTree = (child, signal) => {
  if (process.platform !== 'win32' && child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // Fall back to the direct child below.
    }
  }

  try {
    child.kill(signal);
  } catch {
    // The process may already be gone.
  }
};

export const stopProcessTree = (child, { timeoutMs = 3000 } = {}) =>
  new Promise((resolve, reject) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    if (!isValidPid(child.pid)) {
      reject(new Error('Cannot stop process tree without a child process PID.'));
      return;
    }

    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      resolve();
      return;
    }

    let escalationTimer = null;
    let timeoutTimer = null;
    let resolved = false;

    const finish = () => {
      if (resolved) {
        return;
      }

      resolved = true;
      clearTimeout(escalationTimer);
      clearTimeout(timeoutTimer);
      resolve();
    };

    child.once('exit', finish);
    signalProcessTree(child, 'SIGTERM');

    escalationTimer = setTimeout(() => {
      signalProcessTree(child, 'SIGKILL');
    }, timeoutMs);

    timeoutTimer = setTimeout(() => {
      if (resolved) {
        return;
      }

      resolved = true;
      child.off('exit', finish);
      releaseChildHandles(child);
      reject(new Error(`Timed out stopping process tree for PID ${child.pid}.`));
    }, timeoutMs + 1000);
  });
