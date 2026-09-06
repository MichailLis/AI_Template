import { checkWriteGuard } from './lib/write-guard.mjs';

const ALLOW = '{}';

const readStdin = () =>
  new Promise((resolve) => {
    let data = '';
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => {
        data += chunk;
      });
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', () => resolve(data));
    } catch {
      resolve(data);
    }
  });

const collectAddedContent = (toolName, toolInput) => {
  if (toolName === 'Write') {
    return typeof toolInput.content === 'string' ? toolInput.content : '';
  }

  if (toolName === 'Edit') {
    if (Array.isArray(toolInput.edits)) {
      return toolInput.edits
        .map((edit) => (edit && typeof edit.new_string === 'string' ? edit.new_string : ''))
        .join('\n');
    }
    return typeof toolInput.new_string === 'string' ? toolInput.new_string : '';
  }

  return '';
};

const main = async () => {
  const raw = await readStdin();
  const event = JSON.parse(raw);
  const toolName = event.tool_name;
  const toolInput =
    event.tool_input && typeof event.tool_input === 'object' ? event.tool_input : {};
  const filePath = typeof toolInput.file_path === 'string' ? toolInput.file_path : '';

  if (!filePath) {
    return ALLOW;
  }

  const addedContent = collectAddedContent(toolName, toolInput);
  const violations = checkWriteGuard({ toolName, filePath, addedContent });

  if (violations.length === 0) {
    return ALLOW;
  }

  const reason = violations.map((v) => `[${v.rule}] ${v.message}`).join(' ');
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  });
};

let output = ALLOW;
try {
  output = await main();
} catch {
  output = ALLOW;
}

process.stdout.write(output);
