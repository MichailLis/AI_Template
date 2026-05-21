import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const getLocalNpmCliPath = () => {
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
};

const resolveNpmCommand = (args) => {
  const npmCliPath = getLocalNpmCliPath();

  if (npmCliPath) {
    return {
      executable: process.execPath,
      args: [npmCliPath, ...args],
      options: {},
    };
  }

  if (process.platform === 'win32') {
    return {
      executable: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm', ...args],
      options: {},
    };
  }

  return {
    executable: 'npm',
    args,
    options: {},
  };
};

export const spawnNpm = (args, options = {}) => {
  const command = resolveNpmCommand(args);

  return spawn(command.executable, command.args, {
    ...command.options,
    ...options,
  });
};

export const spawnSyncNpm = (args, options = {}) => {
  const command = resolveNpmCommand(args);

  return spawnSync(command.executable, command.args, {
    ...command.options,
    ...options,
  });
};
