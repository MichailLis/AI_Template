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
          onChange={(event) => onPromptTemplateChange(event.target.value)}
          onScroll={(event) => onPromptEditorScrollTopChange(event.currentTarget.scrollTop)}
          className="min-h-[280px] max-h-[360px] resize-y overflow-auto rounded-none border-0 font-mono text-xs leading-5 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
