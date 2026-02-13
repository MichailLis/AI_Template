export type ModelFilter = 'all' | 'free' | 'paid';
export type ResponseFormat = 'text' | 'json';

export interface PromptVariable {
  id: string;
  key: string;
  value: string;
}

export interface SimulationRun {
  id: string;
  createdAt: string;
  status: 'running' | 'success' | 'error';
  model: string;
  prompt: string;
  output?: string;
  errorMessage?: string;
  latencyMs?: number;
  totalTokens?: number;
}

export interface DuplicateVariableData {
  duplicateKeys: string[];
  duplicateIds: Set<string>;
}
