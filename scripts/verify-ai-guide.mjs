import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const aiGuidePath = join(root, 'AI_GUIDE.md');
const agentPath = join(root, 'AGENT.md');
const readmePath = join(root, 'README.md');

const [aiGuide, agent, readme] = await Promise.all([
  readFile(aiGuidePath, 'utf-8'),
  readFile(agentPath, 'utf-8'),
  readFile(readmePath, 'utf-8'),
]);

const requiredAiGuideTokens = [
  '## AI Agent Operating Mode (Local Development)',
  '## Search Mode (Exhaustive, For Non-Trivial Tasks)',
  '## Refactor Debt Prevention (Always-On)',
  '## Local Verification Entry Points',
  'npm run verify:local',
  'npm run verify:template',
];

const requiredReadmeTokens = ['Use `AI_GUIDE.md` as the source of truth for implementation rules.'];
const requiredAgentTokens = ['AGENTS.md', 'AI_GUIDE.md'];
const forbiddenAgentTokens = ['ULTRATHINK', 'Senior Frontend Architect'];

const errors = [];

for (const token of requiredAiGuideTokens) {
  if (!aiGuide.includes(token)) {
    errors.push(`AI_GUIDE.md: expected to include "${token}"`);
  }
}

for (const token of requiredReadmeTokens) {
  if (!readme.includes(token)) {
    errors.push(`README.md: expected to include "${token}"`);
  }
}

for (const token of requiredAgentTokens) {
  if (!agent.includes(token)) {
    errors.push(`AGENT.md: expected to include "${token}"`);
  }
}

for (const token of forbiddenAgentTokens) {
  if (agent.includes(token)) {
    errors.push(`AGENT.md: expected not to include "${token}"`);
  }
}

if (errors.length > 0) {
  console.error('AI guide verification failed.');
  for (const [index, error] of errors.entries()) {
    console.error(`${index + 1}. ${error}`);
  }
  process.exit(1);
}

console.log('AI guide verification passed.');
