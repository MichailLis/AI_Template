import { ClipboardList, Sparkles } from 'lucide-react';

import {
  studentEducationLevelOptions,
  studentGenderOptions,
} from '@/shared/lib/public-test-labels';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { PublicPersonalDataOperator } from './public-personal-data-operator';
import { PublicPrivacyConsent } from './public-privacy-consent';

import type { DemographicFormState } from './public-test-entry.types';
import type { PublicLinkAccessResponseDtoPersonalData } from '@/shared/api/model';
import type { FormEvent } from 'react';

type FormFieldChangeHandler = <K extends keyof DemographicFormState>(
  key: K,
  value: DemographicFormState[K],
) => void;

interface PublicTestDemographicProfileCardProps {
  formState: DemographicFormState;
  personalData: PublicLinkAccessResponseDtoPersonalData;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: FormFieldChangeHandler;
}

interface DemographicProfileFieldsProps {
  formState: DemographicFormState;
  onFieldChange: FormFieldChangeHandler;
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
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

function DemographicCardHeader() {
  return (
    <CardHeader className="space-y-3 pb-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-2xl font-bold text-transparent">
            Анкета перед тестом
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Заполните основные данные и начните тест
          </CardDescription>
        </div>
        <div className="ml-4 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent p-3 shadow-md">
          <ClipboardList className="h-7 w-7 text-white" />
        </div>
      </div>
    </CardHeader>
  );
}

function DemographicProfileFields({ formState, onFieldChange }: DemographicProfileFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="student-gender" className="font-medium">
          Пол
        </Label>
        <select
          id="student-gender"
          value={formState.gender}
          onChange={(event) =>
            onFieldChange('gender', event.target.value as DemographicFormState['gender'])
          }
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Выберите пол</option>
          {studentGenderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-age" className="font-medium">
          Возраст
        </Label>
        <Input
          id="student-age"
          type="number"
          min={1}
          max={120}
          value={formState.age}
          onChange={(event) => onFieldChange('age', event.target.value)}
          required
          className="h-11"
          placeholder="Например, 17"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-residence" className="font-medium">
          Место жительства
        </Label>
        <Input
          id="student-residence"
          value={formState.residence}
          onChange={(event) => onFieldChange('residence', event.target.value)}
          required
          className="h-11"
          placeholder="Город или населенный пункт"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="student-education-level" className="font-medium">
          Уровень образования
        </Label>
        <select
          id="student-education-level"
          value={formState.educationLevel}
          onChange={(event) =>
            onFieldChange(
              'educationLevel',
              event.target.value as DemographicFormState['educationLevel'],
            )
          }
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Выберите уровень образования</option>
          {studentEducationLevelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function PublicTestDemographicProfileCard({
  formState,
  personalData,
  isSubmitting,
  onSubmit,
  onFieldChange,
}: PublicTestDemographicProfileCardProps) {
  return (
    <div className="order-1 lg:order-2">
      <Card className="relative overflow-hidden border border-border/60 bg-card shadow-xl lg:sticky lg:top-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
        <DemographicCardHeader />

        <CardContent className="px-6 pb-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <PublicPersonalDataOperator personalData={personalData} />
            <DemographicProfileFields formState={formState} onFieldChange={onFieldChange} />
            <PublicPrivacyConsent
              checked={formState.consentAccepted}
              personalData={personalData}
              onCheckedChange={(checked) => onFieldChange('consentAccepted', checked)}
            />
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
