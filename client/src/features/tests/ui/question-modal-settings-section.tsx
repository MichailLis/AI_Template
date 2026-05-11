import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface QuestionModalSettingsSectionProps {
  settingsText: string;
  onSettingsTextChange: (value: string) => void;
}

export function QuestionModalSettingsSection({
  settingsText,
  onSettingsTextChange,
}: QuestionModalSettingsSectionProps) {
  return (
    <details className="rounded-md border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-700">
        Расширенные настройки
      </summary>
      <div className="space-y-2 border-t border-slate-200 p-3">
        <Label htmlFor="question-settings-modal">Настройки JSON (необязательно)</Label>
        <Textarea
          id="question-settings-modal"
          rows={4}
          placeholder='{"hint":"Пояснение для внутренней логики"}'
          value={settingsText}
          onChange={(event) => onSettingsTextChange(event.target.value)}
        />
        <p className="text-xs text-slate-500">
          Используйте только для редких дополнительных параметров вопроса.
        </p>
      </div>
    </details>
  );
}
