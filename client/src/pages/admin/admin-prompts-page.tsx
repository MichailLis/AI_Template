import { Loader2, Sparkles } from 'lucide-react';
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

export default function AdminPromptsPage() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const generateMutation = useAdminControllerGeneratePrompt();

  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('text');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');

  const allModels = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data?.models]);
  const filteredModels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return allModels.filter((item) => {
      const passesTypeFilter =
        modelFilter === 'all' ||
        (modelFilter === 'free' && item.isFree) ||
        (modelFilter === 'paid' && !item.isFree);

      if (!passesTypeFilter) {
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
  }, [allModels, modelFilter, search]);

  const selectedModelCandidate = model || modelsQuery.data?.defaultModel || allModels[0]?.id || '';
  const selectedModel = filteredModels.some((item) => item.id === selectedModelCandidate)
    ? selectedModelCandidate
    : filteredModels[0]?.id || selectedModelCandidate;
  const selectedModelItem = allModels.find((item) => item.id === selectedModel) ?? null;

  const handleGenerate = () => {
    if (!selectedModel || !prompt.trim()) {
      toast.error('Model and prompt are required');
      return;
    }

    const parsedTemperature = Number(temperature);

    if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    generateMutation.mutate(
      {
        data: {
          model: selectedModel,
          prompt: prompt.trim(),
          temperature: parsedTemperature,
          responseFormat,
        },
      },
      {
        onSuccess: (data) => {
          setOutput(data.output);
        },
        onError: (error: unknown) => {
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
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Prompt Studio
          </CardTitle>
          <CardDescription>
            OpenRouter foundation: choose model, submit prompt, inspect response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-model-search">Search models</Label>
            <Input
              id="prompt-model-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, id, or provider"
            />
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
            {filteredModels.length === 0 ? (
              <p className="text-xs text-amber-700">
                No models match current search/filter. Switch filters to select a model.
              </p>
            ) : null}
            {selectedModelItem ? (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                <Badge
                  variant="outline"
                  className={
                    selectedModelItem.isFree
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : ''
                  }
                >
                  {selectedModelItem.isFree ? 'FREE' : 'PAID'}
                </Badge>
                <span className="text-xs text-slate-600">
                  Provider: {selectedModelItem.provider}
                </span>
                <span className="text-xs text-slate-600">
                  Context: {selectedModelItem.contextLength ?? 'n/a'}
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-temperature">Temperature</Label>
            <Input
              id="prompt-temperature"
              value={temperature}
              onChange={(event) => setTemperature(event.target.value)}
              placeholder="0.7"
            />
          </div>

          <div className="space-y-2">
            <Label>Response format</Label>
            <div className="flex flex-wrap items-center gap-2">
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

          <div className="space-y-2">
            <Label htmlFor="prompt-input">Prompt</Label>
            <Textarea
              id="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Write your prompt for the selected model..."
              className="min-h-[180px]"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !selectedModel || filteredModels.length === 0}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate response'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Model Output</CardTitle>
          <CardDescription>Response returned by OpenRouter proxy endpoint.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={output}
            readOnly
            placeholder="Response will appear here after generation..."
            className="min-h-[420px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
