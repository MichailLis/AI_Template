import type { PromptVariable, SimulationRun } from '../model/types';

export const INITIAL_PROMPT = `# SYSTEM PROMPT
You are an AI Career Strategist specialized in {{target_industry}} transitions.
Analyze the candidate's resume and profile.

1. Identify top 3 transferable skills.
2. Suggest 2 pivot roles with compatibility score above 80%.
3. Draft a short LinkedIn bio summary.

# USER CONTEXT
Candidate Name: {{candidate_name}}
Current Role: {{current_role}}
Years of Experience: {{yoe}}

Resume Data:
"""
{{resume_text}}
"""`;

export const INITIAL_VARIABLES: PromptVariable[] = [
  { id: 'var-candidate-name', key: 'candidate_name', value: 'Sarah Jenkins' },
  {
    id: 'var-current-role',
    key: 'current_role',
    value: 'Senior Marketing Manager',
  },
  {
    id: 'var-target-industry',
    key: 'target_industry',
    value: 'FinTech Product Management',
  },
  { id: 'var-yoe', key: 'yoe', value: '8' },
  {
    id: 'var-resume-text',
    key: 'resume_text',
    value:
      'Marketing leader with 8 years of experience in analytics, GTM strategy, and cross-functional execution.',
  },
];

export const INITIAL_RUNS: SimulationRun[] = [
  {
    id: 'seed-success',
    createdAt: '14:23:05',
    status: 'success',
    model: 'openai/gpt-4o-mini',
    prompt: 'Seed simulation output',
    output:
      'Top pivot roles: Growth Product Manager (92%) and Product Marketing Manager (88%).\nTransferable skills: Data-driven decision making, stakeholder management, GTM strategy.\nLinkedIn summary draft generated.',
    latencyMs: 840,
    totalTokens: 452,
  },
  {
    id: 'seed-error',
    createdAt: '14:15:22',
    status: 'error',
    model: 'openai/gpt-4o-mini',
    prompt: 'Seed failed simulation',
    errorMessage: 'Context limit exceeded for variable resume_text.',
  },
];
