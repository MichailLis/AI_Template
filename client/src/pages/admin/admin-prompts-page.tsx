import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Play,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminControllerGeneratePrompt,
  useAdminControllerGetPromptModels,
} from '@/shared/api/generated/admin/admin';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

type ModelFilter = 'all' | 'free' | 'paid';
type ResponseFormat = 'text' | 'json';

interface PromptVariable {
  id: string;
  key: string;
  value: string;
}

interface SimulationRun {
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

const INITIAL_PROMPT = `# SYSTEM PROMPT
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

const INITIAL_VARIABLES: PromptVariable[] = [
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

const INITIAL_RUNS: SimulationRun[] = [
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

const getApiErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Request failed';
  }

  const response = error.response;

  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return 'Request failed';
  }

  const data = response.data;

  if (typeof data !== 'object' || data === null) {
    return 'Request failed';
  }

  if (
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'message' in data.error
  ) {
    return String(data.error.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return 'Request failed';
};

const formatNow = () => new Date().toLocaleTimeString();

const estimateTokens = (value: string) => Math.max(1, Math.ceil(value.length / 4));

const generateRunId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createVariableId = () => `var-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const interpolatePrompt = (template: string, variables: PromptVariable[]) => {
  let output = template;

  for (const variable of variables) {
    const normalizedKey = variable.key.trim();

    if (!normalizedKey) {
      continue;
    }

    const token = `{{${normalizedKey}}}`;
    output = output.split(token).join(variable.value);
  }

  return output;
};

export default function AdminPromptsPage() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const generateMutation = useAdminControllerGeneratePrompt();

  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('text');
  const [modelSearch, setModelSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('free');
  const [systemRole, setSystemRole] = useState('Career Counselor Expert');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [promptTemplate, setPromptTemplate] = useState(INITIAL_PROMPT);
  const [promptEditorScrollTop, setPromptEditorScrollTop] = useState(0);
  const [variables, setVariables] = useState<PromptVariable[]>(INITIAL_VARIABLES);
  const [showMetrics, setShowMetrics] = useState(true);
  const [diffView, setDiffView] = useState(false);
  const [runs, setRuns] = useState<SimulationRun[]>(INITIAL_RUNS);

  const allModels = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data?.models]);

  const filteredModels = useMemo(() => {
    const normalizedSearch = modelSearch.trim().toLowerCase();
    const hasFreeModels = allModels.some((item) => item.isFree);
    const effectiveModelFilter = modelFilter === 'free' && !hasFreeModels ? 'all' : modelFilter;

    return allModels.filter((item) => {
      const byType =
        effectiveModelFilter === 'all' ||
        (effectiveModelFilter === 'free' && item.isFree) ||
        (effectiveModelFilter === 'paid' && !item.isFree);

      if (!byType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        item.id.toLowerCase().includes(normalizedSearch) ||
        item.label.toLowerCase().includes(normalizedSearch) ||
        item.provider.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [allModels, modelFilter, modelSearch]);

  const defaultFreeModel = allModels.find((item) => item.isFree)?.id;
  const selectedModelCandidate =
    model || defaultFreeModel || modelsQuery.data?.defaultModel || allModels[0]?.id || '';
  const selectedModel = filteredModels.some((item) => item.id === selectedModelCandidate)
    ? selectedModelCandidate
    : filteredModels[0]?.id || selectedModelCandidate;

  const selectedModelItem = allModels.find((item) => item.id === selectedModel) ?? null;

  const renderedPrompt = useMemo(
    () => interpolatePrompt(promptTemplate, variables),
    [promptTemplate, variables],
  );

  const duplicateVariableData = useMemo(() => {
    const keyToIds = new Map<string, string[]>();

    for (const variable of variables) {
      const normalizedKey = variable.key.trim();

      if (!normalizedKey) {
        continue;
      }

      const existingIds = keyToIds.get(normalizedKey) ?? [];
      keyToIds.set(normalizedKey, [...existingIds, variable.id]);
    }

    const duplicateEntries = Array.from(keyToIds.entries()).filter(([, ids]) => ids.length > 1);

    return {
      duplicateKeys: duplicateEntries.map(([key]) => key),
      duplicateIds: new Set(duplicateEntries.flatMap(([, ids]) => ids)),
    };
  }, [variables]);

  const detectedVariablesCount = useMemo(() => {
    const matches = promptTemplate.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) ?? [];
    return new Set(matches).size;
  }, [promptTemplate]);

  const promptLineCount = useMemo(
    () => Math.max(1, promptTemplate.split('\n').length),
    [promptTemplate],
  );

  const updateVariable = (variableId: string, field: 'key' | 'value', value: string) => {
    setVariables((prev) =>
      prev.map((item) => {
        if (item.id !== variableId) {
          return item;
        }

        return field === 'key' ? { ...item, key: value } : { ...item, value };
      }),
    );
  };

  const addVariable = () => {
    const nextIndex = variables.length + 1;

    setVariables((prev) => [
      ...prev,
      {
        id: createVariableId(),
        key: `variable_${nextIndex}`,
        value: '',
      },
    ]);
  };

  const removeVariable = (variableId: string) => {
    setVariables((prev) => prev.filter((item) => item.id !== variableId));
  };

  const copyRunJson = async (run: SimulationRun) => {
    const payload = {
      createdAt: run.createdAt,
      status: run.status,
      model: run.model,
      prompt: run.prompt,
      output: run.output,
      errorMessage: run.errorMessage,
      latencyMs: run.latencyMs,
      totalTokens: run.totalTokens,
      responseFormat,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Run JSON copied');
    } catch {
      toast.error('Unable to copy run JSON');
    }
  };

  const handleGenerate = () => {
    if (!selectedModel) {
      toast.error('Select a model first');
      return;
    }

    if (duplicateVariableData.duplicateKeys.length > 0) {
      toast.error(`Duplicate variable keys: ${duplicateVariableData.duplicateKeys.join(', ')}`);
      return;
    }

    const parsedTemperature = Number(temperature);

    if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    const preparedPrompt = renderedPrompt.trim();

    if (!preparedPrompt) {
      toast.error('Prompt is empty after variable substitution');
      return;
    }

    const runId = generateRunId();
    const startedAt = Date.now();

    setRuns((prev) => [
      {
        id: runId,
        createdAt: formatNow(),
        status: 'running',
        model: selectedModel,
        prompt: preparedPrompt,
      },
      ...prev,
    ]);

    generateMutation.mutate(
      {
        data: {
          model: selectedModel,
          prompt: preparedPrompt,
          temperature: parsedTemperature,
          responseFormat,
        },
      },
      {
        onSuccess: (data) => {
          const latencyMs = Date.now() - startedAt;
          const totalTokens = estimateTokens(preparedPrompt + data.output);

          setRuns((prev) =>
            prev.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'success',
                    output: data.output,
                    latencyMs,
                    totalTokens,
                  }
                : run,
            ),
          );
        },
        onError: (error: unknown) => {
          setRuns((prev) =>
            prev.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'error',
                    errorMessage: getApiErrorMessage(error),
                  }
                : run,
            ),
          );
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  if (modelsQuery.isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 text-sm text-slate-500">Loading model catalog...</CardContent>
      </Card>
    );
  }

  if (modelsQuery.isError || !modelsQuery.data) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-sm">
        <CardContent className="space-y-4 p-6 text-sm text-red-700">
          <p>Unable to load OpenRouter models.</p>
          <Button variant="outline" size="sm" onClick={() => modelsQuery.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[2fr_3fr]">
      <Card className="min-w-0 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Prompt Editor
          </CardTitle>
          <CardDescription>
            First approximation for student career guidance prompt workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt-model-search">Search models</Label>
              <Input
                id="prompt-model-search"
                value={modelSearch}
                onChange={(event) => setModelSearch(event.target.value)}
                placeholder="Search by name, id, or provider"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-model">Model</Label>
              <select
                id="prompt-model"
                value={selectedModel}
                onChange={(event) => setModel(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {filteredModels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={modelFilter === 'all' ? 'secondary' : 'outline'}
              onClick={() => setModelFilter('all')}
            >
              All
            </Button>
            <Button
              type="button"
              size="sm"
              variant={modelFilter === 'free' ? 'secondary' : 'outline'}
              onClick={() => setModelFilter('free')}
            >
              Free
            </Button>
            <Button
              type="button"
              size="sm"
              variant={modelFilter === 'paid' ? 'secondary' : 'outline'}
              onClick={() => setModelFilter('paid')}
            >
              Paid
            </Button>
            <p className="ml-auto text-xs text-slate-500">
              Showing {filteredModels.length} of {allModels.length}
            </p>
          </div>

          {selectedModelItem ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <Badge
                variant="outline"
                className={
                  selectedModelItem.isFree
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300'
                }
              >
                {selectedModelItem.isFree ? 'FREE' : 'PAID'}
              </Badge>
              <span className="text-xs text-slate-600">Provider: {selectedModelItem.provider}</span>
              <span className="text-xs text-slate-600">
                Context: {selectedModelItem.contextLength ?? 'n/a'}
              </span>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt-temperature">
                Temperature <span className="text-slate-500">({temperature})</span>
              </Label>
              <input
                id="prompt-temperature"
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(event.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-max-tokens">Max tokens</Label>
              <Input
                id="prompt-max-tokens"
                value={maxTokens}
                onChange={(event) => setMaxTokens(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt-system-role">System role</Label>
              <Input
                id="prompt-system-role"
                value={systemRole}
                onChange={(event) => setSystemRole(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Response format</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={responseFormat === 'text' ? 'secondary' : 'outline'}
                  onClick={() => setResponseFormat('text')}
                >
                  Text
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={responseFormat === 'json' ? 'secondary' : 'outline'}
                  onClick={() => setResponseFormat('json')}
                >
                  JSON
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-template">Prompt template</Label>
            <div className="grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-md border border-input">
              <div className="overflow-hidden border-r border-slate-200 bg-slate-50 text-right">
                <div
                  className="py-2 pr-2 font-mono text-[11px] leading-5 text-slate-400"
                  style={{ transform: `translateY(-${promptEditorScrollTop}px)` }}
                >
                  {Array.from({ length: promptLineCount }, (_, index) => (
                    <div key={`line-${index + 1}`}>{index + 1}</div>
                  ))}
                </div>
              </div>
              <Textarea
                id="prompt-template"
                value={promptTemplate}
                onChange={(event) => setPromptTemplate(event.target.value)}
                onScroll={(event) => setPromptEditorScrollTop(event.currentTarget.scrollTop)}
                className="min-h-[280px] max-h-[360px] resize-y overflow-auto rounded-none border-0 font-mono text-xs leading-5 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-slate-600">
                Test Variables ({variables.length})
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">
                  Question system is not connected yet, using manual values.
                </p>
                <Button type="button" size="sm" variant="outline" onClick={addVariable}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add variable
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              {variables.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                  No test variables. Add one to inject placeholders.
                </div>
              ) : null}
              {duplicateVariableData.duplicateKeys.length > 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>
                    Duplicate variable keys detected:{' '}
                    {duplicateVariableData.duplicateKeys.join(', ')}. Keep each key unique to avoid
                    ambiguous substitutions.
                  </span>
                </div>
              ) : null}
              {variables.map((variable) => (
                <div
                  key={variable.id}
                  className="grid items-center gap-2 md:grid-cols-[170px_minmax(0,1fr)_auto]"
                >
                  <Input
                    value={variable.key}
                    onChange={(event) => updateVariable(variable.id, 'key', event.target.value)}
                    className={`font-mono text-xs ${
                      duplicateVariableData.duplicateIds.has(variable.id)
                        ? 'border-amber-300 bg-amber-50 focus-visible:ring-amber-400'
                        : ''
                    }`}
                    placeholder="variable_key"
                  />
                  <Input
                    value={variable.value}
                    onChange={(event) => updateVariable(variable.id, 'value', event.target.value)}
                    className="font-mono text-xs"
                    placeholder="Variable value"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeVariable(variable.id)}
                    aria-label={`Remove variable ${variable.key}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Simulation Output</CardTitle>
              <CardDescription>
                Simulated run history for first approximation of UX flow.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showMetrics}
                  onChange={(event) => setShowMetrics(event.target.checked)}
                />
                Show metrics
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={diffView}
                  onChange={(event) => setDiffView(event.target.checked)}
                />
                Diff view
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={() => setRuns([])}>
                Clear logs
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col p-0">
          <div className="max-h-[640px] flex-1 space-y-3 overflow-y-auto p-4">
            {runs.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No simulation logs yet. Run simulation to see output blocks.
              </div>
            ) : null}

            {runs.map((run, index) => (
              <div key={run.id} className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                  <span>
                    INPUT #{String(runs.length - index).padStart(3, '0')} - {run.createdAt}
                  </span>
                  <span>{run.model}</span>
                </div>

                <div className="space-y-3 px-4 py-3">
                  {run.status === 'running' ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running simulation...
                    </div>
                  ) : null}

                  {run.status === 'error' ? (
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <span>{run.errorMessage ?? 'Unknown error'}</span>
                    </div>
                  ) : null}

                  {run.status === 'success' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </div>
                      {diffView ? (
                        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                          {run.output}
                        </pre>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm text-slate-700">
                          {run.output}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {showMetrics && run.status === 'success' ? (
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Latency: {run.latencyMs ?? '-'}ms</span>
                      <span>Tokens: {run.totalTokens ?? '-'}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void copyRunJson(run)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="outline">{detectedVariablesCount} variables detected</Badge>
              <span>Ready to run</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.info('Draft persistence is planned in the next iteration')}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={
                  generateMutation.isPending ||
                  !selectedModel ||
                  filteredModels.length === 0 ||
                  duplicateVariableData.duplicateKeys.length > 0
                }
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
