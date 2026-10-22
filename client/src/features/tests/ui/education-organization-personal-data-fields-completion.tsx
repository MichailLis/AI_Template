import { CheckCircle2, Circle } from 'lucide-react';

import {
  getPersonalDataFieldsCompletion,
  type EducationOrganizationFormValues,
} from './education-organization-form.schema';

interface EducationOrganizationPersonalDataFieldsCompletionProps {
  values: EducationOrganizationFormValues;
}

export function EducationOrganizationPersonalDataFieldsCompletion({
  values,
}: EducationOrganizationPersonalDataFieldsCompletionProps) {
  const completion = getPersonalDataFieldsCompletion(values);
  const items = [
    { label: 'Полное наименование', ready: Boolean(values.fullName.trim()) },
    { label: 'Сокращённое наименование', ready: Boolean(values.shortName.trim()) },
    { label: 'Политика обработки ПДн', ready: Boolean(values.privacyPolicyUrl.trim()) },
  ];

  return (
    <div
      className="rounded-md border border-admin-border bg-admin-panel-muted/40 p-3"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-admin-foreground">
        {`Заполнение данных ПДн: ${completion.completed} из ${completion.total}`}
      </p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.ready ? CheckCircle2 : Circle;
          return (
            <span
              key={item.label}
              className={
                item.ready
                  ? 'flex gap-1.5 text-xs text-admin-success-foreground'
                  : 'flex gap-1.5 text-xs text-admin-muted'
              }
            >
              <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
