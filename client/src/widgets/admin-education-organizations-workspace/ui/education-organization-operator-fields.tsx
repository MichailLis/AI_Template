import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export interface EducationOrganizationOperatorValues {
  fullName: string;
  shortName: string;
  inn: string;
  ogrn: string;
  legalAddress: string;
  email: string;
  phone: string;
  privacyPolicyUrl: string;
  consentDocumentUrl: string;
  logoUrl: string;
}

export type EducationOrganizationOperatorField = keyof EducationOrganizationOperatorValues;

interface EducationOrganizationOperatorFieldsProps {
  idPrefix: string;
  values: EducationOrganizationOperatorValues;
  onChange: (field: EducationOrganizationOperatorField, value: string) => void;
  disabled?: boolean;
}

interface OperatorFieldConfig {
  field: EducationOrganizationOperatorField;
  label: string;
  placeholder: string;
  operatorRequired?: boolean;
  type?: 'text' | 'url';
  autoComplete?: string;
  className?: string;
}

const FIELD_GROUPS: Array<{ title: string; fields: OperatorFieldConfig[] }> = [
  {
    title: 'Оператор персональных данных',
    fields: [
      {
        field: 'fullName',
        label: 'Полное наименование',
        placeholder:
          'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
        operatorRequired: true,
        autoComplete: 'organization',
        className: 'sm:col-span-2',
      },
      {
        field: 'shortName',
        label: 'Сокращённое наименование',
        placeholder: 'Например: МАОУ «Лицей № 42»',
        operatorRequired: true,
        autoComplete: 'organization',
      },
    ],
  },
  {
    title: 'Контакты и реквизиты',
    fields: [
      { field: 'inn', label: 'ИНН', placeholder: 'Например: 1234567890' },
      { field: 'ogrn', label: 'ОГРН', placeholder: 'Например: 1234567890123' },
      {
        field: 'legalAddress',
        label: 'Юридический адрес',
        placeholder: 'Например: г. Казань, ул. Школьная, д. 1',
        autoComplete: 'street-address',
        className: 'sm:col-span-2',
      },
      {
        field: 'email',
        label: 'Email',
        placeholder: 'Например: office@school.example',
        autoComplete: 'email',
      },
      {
        field: 'phone',
        label: 'Телефон',
        placeholder: 'Например: +7 900 000-00-00',
        autoComplete: 'tel',
      },
    ],
  },
  {
    title: 'Документы и оформление',
    fields: [
      {
        field: 'privacyPolicyUrl',
        label: 'Политика обработки ПДн',
        placeholder: 'https://school.example/privacy',
        operatorRequired: true,
        type: 'url',
      },
      {
        field: 'consentDocumentUrl',
        label: 'Документ согласия',
        placeholder: 'https://school.example/consent',
        type: 'url',
      },
      {
        field: 'logoUrl',
        label: 'Логотип',
        placeholder: 'https://school.example/logo.svg',
        type: 'url',
        className: 'sm:col-span-2',
      },
    ],
  },
];

export function EducationOrganizationOperatorFields({
  idPrefix,
  values,
  onChange,
  disabled = false,
}: EducationOrganizationOperatorFieldsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-admin-muted">
        * — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить
        и заполнить позже.
      </p>

      {FIELD_GROUPS.map((group) => (
        <fieldset
          key={group.title}
          className="space-y-3 rounded-md border border-admin-border bg-admin-panel-muted/30 p-3"
        >
          <legend className="px-1 text-sm font-medium text-admin-foreground">{group.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map((fieldConfig) => {
              const inputId = `${idPrefix}-organization-${fieldConfig.field}`;
              const fieldLabel = fieldConfig.operatorRequired
                ? `${fieldConfig.label} *`
                : `${fieldConfig.label} — необязательно`;

              return (
                <div key={fieldConfig.field} className={`space-y-2 ${fieldConfig.className ?? ''}`}>
                  <Label htmlFor={inputId}>{fieldLabel}</Label>
                  <Input
                    id={inputId}
                    name={fieldConfig.field}
                    type={fieldConfig.type ?? 'text'}
                    autoComplete={fieldConfig.autoComplete ?? 'off'}
                    placeholder={fieldConfig.placeholder}
                    value={values[fieldConfig.field]}
                    onChange={(event) => onChange(fieldConfig.field, event.target.value)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
