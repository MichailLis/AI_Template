import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface PromptEditorTemplateSectionProps {
  promptTemplate: string;
  onPromptTemplateChange: (value: string) => void;
  promptLineCount: number;
  promptEditorScrollTop: number;
  onPromptEditorScrollTopChange: (value: number) => void;
}

export function PromptEditorTemplateSection({
  promptTemplate,
  onPromptTemplateChange,
  promptLineCount,
  promptEditorScrollTop,
  onPromptEditorScrollTopChange,
}: PromptEditorTemplateSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt-template">Шаблон промпта</Label>
      <div className={adminClassNames.editor.shell}>
        <div className={adminClassNames.editor.rail}>
          <div
            className={`py-2 pr-2 font-mono text-[11px] leading-5 ${adminClassNames.text.muted}`}
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
          onChange={(event) => onPromptTemplateChange(event.target.value)}
          onScroll={(event) => onPromptEditorScrollTopChange(event.currentTarget.scrollTop)}
          className="min-h-[280px] max-h-[360px] resize-y overflow-auto rounded-none border-0 font-mono text-xs leading-5 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
