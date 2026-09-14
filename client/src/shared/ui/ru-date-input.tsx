import * as React from 'react';

import {
  formatIsoDateAsRu,
  formatIsoDateTimeLocalAsRu,
  maskRuDateInput,
  maskRuDateTimeInput,
  parseRuDate,
  parseRuDateTime,
} from '@/shared/lib/date-input';

import { Input } from './input';

/**
 * `date` заменяет `<input type="date">` и работает с `ГГГГ-ММ-ДД`, `datetime` заменяет
 * `<input type="datetime-local">` и работает с `ГГГГ-ММ-ДДTЧЧ:мм`. Длина полного ввода совпадает
 * с длиной плейсхолдера.
 */
const RU_DATE_FORMATS = {
  date: {
    placeholder: 'ДД.ММ.ГГГГ',
    mask: maskRuDateInput,
    parse: parseRuDate,
    format: formatIsoDateAsRu,
  },
  datetime: {
    placeholder: 'ДД.ММ.ГГГГ ЧЧ:ММ',
    mask: maskRuDateTimeInput,
    parse: parseRuDateTime,
    format: formatIsoDateTimeLocalAsRu,
  },
} as const;

type RuDateInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  mode?: keyof typeof RU_DATE_FORMATS;
  /** Тот же контракт, что у нативного поля: `ГГГГ-ММ-ДД` или `ГГГГ-ММ-ДДTЧЧ:мм`, либо пустая строка. */
  value: string;
  /** Вызывается со значением, когда ввод полный и существует, и с пустой строкой при очистке. */
  onChange: (value: string) => void;
  /**
   * Вызывается при изменении валидности текущего отображаемого значения.
   * false, когда в поле незавершённый черновик или несуществующая дата.
   * true, когда ввод полностью валиден или поле очищено.
   */
  onValidityChange?: (isValid: boolean) => void;
};

/**
 * Поле даты с маской ДД.ММ.ГГГГ, одинаковое в любом браузере.
 *
 * Пока ввод не допечатан, он живёт в собственном черновике поля, а родителю не уходит ничего:
 * фильтр не должен перестраивать отчёт на `06.09.20`. Показываемое значение вычисляется при
 * рендере — черновик или значение родителя.
 * При внешнем изменении `value` черновик сбрасывается.
 */
export const RuDateInput = React.forwardRef<HTMLInputElement, RuDateInputProps>(
  ({ mode = 'date', value, onChange, onValidityChange, ...props }, ref) => {
    const format = RU_DATE_FORMATS[mode];
    const completeLength = format.placeholder.length;
    const [draft, setDraft] = React.useState<string | null>(null);
    const lastValueRef = React.useRef(value);

    React.useEffect(() => {
      if (lastValueRef.current !== value) {
        lastValueRef.current = value;
        if (draft !== null) {
          setDraft(null);
          onValidityChange?.(true);
        }
      }
    }, [value, draft, onValidityChange]);

    const displayValue = draft ?? format.format(value);
    const isInvalid =
      draft !== null && draft.length === completeLength && format.parse(draft) === null;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={format.placeholder}
        maxLength={completeLength}
        aria-invalid={isInvalid || undefined}
        {...props}
        value={displayValue}
        onChange={(event) => {
          const masked = format.mask(event.target.value);

          if (masked === '') {
            lastValueRef.current = '';
            setDraft(null);
            onValidityChange?.(true);
            onChange('');
            return;
          }

          const parsed = format.parse(masked);

          if (parsed) {
            lastValueRef.current = parsed;
            setDraft(null);
            onValidityChange?.(true);
            onChange(parsed);
            return;
          }

          setDraft(masked);
          onValidityChange?.(false);
        }}
      />
    );
  },
);
RuDateInput.displayName = 'RuDateInput';
