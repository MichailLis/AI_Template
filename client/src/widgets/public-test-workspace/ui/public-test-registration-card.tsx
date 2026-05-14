import { GraduationCap, Sparkles } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { StudentFormState } from './public-test-entry.types';
import type { FormEvent } from 'react';

type GroupValidationMode = 'NONE' | 'HINT' | 'STRICT';
type FormFieldChangeHandler = <K extends keyof StudentFormState>(
  key: K,
  value: StudentFormState[K],
) => void;

interface PublicTestRegistrationCardProps {
  formState: StudentFormState;
  lockedEducationOrganization: string | null;
  groupValidationMode: GroupValidationMode;
  groupValidationExample: string | null;
  groupValidationHint: string | null;
  groupValidationWarning: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: FormFieldChangeHandler;
}

interface RegistrationFormFieldsProps {
  formState: StudentFormState;
  onFieldChange: FormFieldChangeHandler;
}

function RegistrationCardHeader() {
  return (
    <CardHeader className="space-y-3 pb-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-2xl font-bold text-transparent">
            Регистрация
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Заполните учебные данные и начните тест
          </CardDescription>
        </div>
        <div className="ml-4 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent p-3 shadow-md">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
      </div>
    </CardHeader>
  );
}

function IdentityFields({ formState, onFieldChange }: RegistrationFormFieldsProps) {
  return (
    <>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-name" className="font-medium">
          Имя
        </Label>
        <Input
          id="student-name"
          value={formState.studentName}
          onChange={(event) => onFieldChange('studentName', event.target.value)}
          required
          className="h-11"
          placeholder="Введите ваше имя"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-last-initial" className="font-medium">
          Фамилия (1-я буква)
        </Label>
        <Input
          id="student-last-initial"
          value={formState.studentLastInitial}
          maxLength={1}
          onChange={(event) =>
            onFieldChange('studentLastInitial', event.target.value.toUpperCase())
          }
          required
          placeholder="И"
          className="h-11 text-center text-lg font-semibold uppercase"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-middle-initial" className="font-medium">
          Отчество (1-я буква)
        </Label>
        <Input
          id="student-middle-initial"
          value={formState.studentMiddleInitial}
          maxLength={1}
          onChange={(event) =>
            onFieldChange('studentMiddleInitial', event.target.value.toUpperCase())
          }
          required
          placeholder="О"
          className="h-11 text-center text-lg font-semibold uppercase"
        />
      </div>
    </>
  );
}

interface EducationOrganizationFieldProps extends RegistrationFormFieldsProps {
  lockedEducationOrganization: string | null;
}

function EducationOrganizationField({
  formState,
  lockedEducationOrganization,
  onFieldChange,
}: EducationOrganizationFieldProps) {
  const educationOrganizationPlaceholder = lockedEducationOrganization
    ? 'Учебное заведение определено по ссылке'
    : 'Школа, колледж, вуз...';

  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="student-education-org" className="font-medium">
        Учебное заведение
      </Label>
      <Input
        id="student-education-org"
        value={formState.educationOrganization}
        onChange={(event) => onFieldChange('educationOrganization', event.target.value)}
        required
        disabled={Boolean(lockedEducationOrganization)}
        className="h-11"
        placeholder={educationOrganizationPlaceholder}
      />
      {lockedEducationOrganization ? (
        <p className="text-xs text-slate-500">
          Значение задано администратором для этой публичной ссылки.
        </p>
      ) : null}
    </div>
  );
}

interface GroupFieldProps extends RegistrationFormFieldsProps {
  groupValidationMode: GroupValidationMode;
  groupValidationExample: string | null;
  groupValidationHint: string | null;
  groupValidationWarning: string | null;
}

function GroupField({
  formState,
  groupValidationMode,
  groupValidationExample,
  groupValidationHint,
  groupValidationWarning,
  onFieldChange,
}: GroupFieldProps) {
  const warningClassName = groupValidationMode === 'STRICT' ? 'text-red-600' : 'text-amber-600';

  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="student-group" className="font-medium">
        Группа / класс
      </Label>
      <Input
        id="student-group"
        value={formState.groupOrClass}
        onChange={(event) => onFieldChange('groupOrClass', event.target.value)}
        required
        className="h-11"
        placeholder={groupValidationExample || '10А, ИС-21...'}
      />
      {groupValidationExample ? (
        <p className="text-xs text-slate-500">Пример формата: {groupValidationExample}</p>
      ) : null}
      {groupValidationHint ? <p className="text-xs text-slate-500">{groupValidationHint}</p> : null}
      {groupValidationWarning ? (
        <p className={`text-xs ${warningClassName}`}>{groupValidationWarning}</p>
      ) : null}
    </div>
  );
}

interface SubmitButtonProps {
  isSubmitting: boolean;
}

function SubmitButton({ isSubmitting }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className="h-12 w-full bg-gradient-to-r from-primary to-accent font-medium shadow-md transition-all hover:from-primary/90 hover:to-accent/90 hover:shadow-lg"
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Запускаем тест...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Начать тестирование
        </span>
      )}
    </Button>
  );
}

export function PublicTestRegistrationCard({
  formState,
  lockedEducationOrganization,
  groupValidationMode,
  groupValidationExample,
  groupValidationHint,
  groupValidationWarning,
  isSubmitting,
  onSubmit,
  onFieldChange,
}: PublicTestRegistrationCardProps) {
  return (
    <div className="order-1 lg:order-2">
      <Card className="relative overflow-hidden border border-border/60 bg-card shadow-xl lg:sticky lg:top-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
        <RegistrationCardHeader />

        <CardContent className="px-6 pb-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <IdentityFields formState={formState} onFieldChange={onFieldChange} />
              <EducationOrganizationField
                formState={formState}
                lockedEducationOrganization={lockedEducationOrganization}
                onFieldChange={onFieldChange}
              />
              <GroupField
                formState={formState}
                groupValidationMode={groupValidationMode}
                groupValidationExample={groupValidationExample}
                groupValidationHint={groupValidationHint}
                groupValidationWarning={groupValidationWarning}
                onFieldChange={onFieldChange}
              />
            </div>

            <SubmitButton isSubmitting={isSubmitting} />

            <p className="mt-3 text-center text-xs text-muted-foreground">
              После нажатия кнопки вы перейдете к вопросам теста
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
