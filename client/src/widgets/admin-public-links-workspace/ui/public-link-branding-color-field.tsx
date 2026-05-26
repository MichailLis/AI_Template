import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const brandColorSwatches = [
  '#0066cc',
  '#1455d9',
  '#00a889',
  '#ff6b35',
  '#f59e0b',
  '#7c3aed',
  '#0f172a',
  '#071826',
  '#ffffff',
  '#f2f7fb',
  '#d4dee8',
  '#e11d48',
];
const sixDigitHexColorPattern = /^#[0-9a-fA-F]{6}$/;

export function PublicLinkBrandingColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedValue = value.toLowerCase();
  const pickerValue = sixDigitHexColorPattern.test(value) ? value : '#000000';

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
        <input
          aria-label={`Открыть палитру для ${label}`}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2" aria-label={`Готовые цвета для ${label}`}>
        {brandColorSwatches.map((swatch) => {
          const isSelected = selectedValue === swatch;

          return (
            <button
              key={`${id}-${swatch}`}
              type="button"
              aria-label={`Выбрать ${swatch} для ${label}`}
              aria-pressed={isSelected}
              title={swatch}
              className={`size-7 rounded-full border border-border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isSelected ? 'ring-2 ring-ring ring-offset-2' : ''
              }`}
              style={{ backgroundColor: swatch }}
              onClick={() => onChange(swatch)}
            />
          );
        })}
      </div>
    </div>
  );
}
