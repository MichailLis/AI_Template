import { useState } from 'react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Label } from '@/shared/ui/label';
import { RuDateInput } from '@/shared/ui/ru-date-input';

import { validateAccessWindow } from '../lib/access-window';

import type { AccessWindowField, AccessWindowValues } from '../lib/access-window';

interface PublicLinkAccessWindowFieldsProps {
  values: AccessWindowValues;
  onChange: (field: AccessWindowField, value: string) => void;
  /** Сообщает false, пока в каком-то поле незавершенный или несуществующий ввод: такое значение не сохранится. */
  onDraftValidityChange?: (isValid: boolean) => void;
}

const FIELDS: { field: AccessWindowField; label: string }[] = [
  { field: 'startsAt', label: 'Открыть с' },
  { field: 'endsAt', label: 'Закрыть в' },
];

/** Окно доступа: два поля даты и времени. Значения и их проверку держит вызывающий. */
export function PublicLinkAccessWindowFields({
  values,
  onChange,
  onDraftValidityChange,
}: PublicLinkAccessWindowFieldsProps) {
  const [invalidFields, setInvalidFields] = useState<Record<AccessWindowField, boolean>>({
    startsAt: false,
    endsAt: false,
  });
  const orderError = validateAccessWindow(values);

  const reportValidity = (field: AccessWindowField, isValid: boolean) => {
    const next = { ...invalidFields, [field]: !isValid };
    setInvalidFields(next);
    onDraftValidityChange?.(!next.startsAt && !next.endsAt);
  };

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map(({ field, label }) => (
          <div key={field} className="flex flex-col gap-2">
            <Label htmlFor={`public-link-${field}`}>{label}</Label>
            <RuDateInput
              id={`public-link-${field}`}
              mode="datetime"
              value={values[field]}
              onChange={(value) => onChange(field, value)}
              onValidityChange={(isValid) => reportValidity(field, isValid)}
            />
          </div>
        ))}
      </div>
      {orderError ? (
        <p role="alert" className={adminClassNames.panel.dangerInline}>
          {orderError}
        </p>
      ) : (
        <p className={adminClassNames.form.fieldHint}>
          Время по часовому поясу этого браузера. Пустое поле — без ограничения.
        </p>
      )}
    </div>
  );
}
