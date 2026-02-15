import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { ResponseFormat } from '../model/types';

interface PromptEditorSettingsSectionProps {
  temperature: string;
  onTemperatureChange: (value: string) => void;
  systemRole: string;
  onSystemRoleChange: (value: string) => void;
  maxTokens: string;
  onMaxTokensChange: (value: string) => void;
  responseFormat: ResponseFormat;
  onResponseFormatChange: (value: ResponseFormat) => void;
}

export function PromptEditorSettingsSection({
  temperature,
  onTemperatureChange,
  systemRole,
  onSystemRoleChange,
  maxTokens,
  onMaxTokensChange,
  responseFormat,
  onResponseFormatChange,
}: PromptEditorSettingsSectionProps) {
  return (
    <>
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
            onChange={(event) => onTemperatureChange(event.target.value)}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-max-tokens">Max tokens</Label>
          <Input
            id="prompt-max-tokens"
            value={maxTokens}
            onChange={(event) => onMaxTokensChange(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prompt-system-role">System role</Label>
          <Input
            id="prompt-system-role"
            value={systemRole}
            onChange={(event) => onSystemRoleChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Response format</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={responseFormat === 'text' ? 'secondary' : 'outline'}
              onClick={() => onResponseFormatChange('text')}
            >
              Text
            </Button>
            <Button
              type="button"
              size="sm"
              variant={responseFormat === 'json' ? 'secondary' : 'outline'}
              onClick={() => onResponseFormatChange('json')}
            >
              JSON
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
