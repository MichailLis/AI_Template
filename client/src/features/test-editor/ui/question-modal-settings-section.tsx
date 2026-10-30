import { adminClassNames } from '@/shared/ui/admin-design-tokens';
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
    <details className={adminClassNames.panel.frame}>
      <summary
        className={`cursor-pointer select-none px-3 py-2 text-sm font-medium ${adminClassNames.text.body}`}
      >
        Расширенные настройки
      </summary>
      <div className={`space-y-2 p-3 ${adminClassNames.border.top}`}>
        <Label htmlFor="question-settings-modal">Настройки JSON (необязательно)</Label>
        <Textarea
          id="question-settings-modal"
          rows={4}
          placeholder='{"hint":"Пояснение для внутренней логики"}'
          value={settingsText}
          onChange={(event) => onSettingsTextChange(event.target.value)}
        />
        <p className={adminClassNames.form.fieldHint}>
          Используйте только для редких дополнительных параметров вопроса.
        </p>
      </div>
    </details>
  );
}
