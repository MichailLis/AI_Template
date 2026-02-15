import { GraduationCap, Sparkles } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { StudentFormState } from './public-test-entry.types';
import type { FormEvent } from 'react';

interface PublicTestRegistrationCardProps {
  formState: StudentFormState;
  lockedEducationOrganization: string | null;
  consentVersion: string;
  consentText: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => void;
}

export function PublicTestRegistrationCard({
  formState,
  lockedEducationOrganization,
  consentVersion,
  consentText,
  isSubmitting,
  onSubmit,
  onFieldChange,
}: PublicTestRegistrationCardProps) {
  return (
    <div className="order-1 lg:order-2">
      <Card className="relative overflow-hidden border border-border/60 bg-card shadow-xl lg:sticky lg:top-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

        <CardHeader className="space-y-3 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-2xl font-bold text-transparent">
                Регистрация
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Заполните анкету для начала тестирования
              </CardDescription>
            </div>
            <div className="ml-4 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent p-3 shadow-md">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
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
                  placeholder={
                    lockedEducationOrganization
                      ? 'Учебное заведение определено по ссылке'
                      : 'Школа, колледж, вуз...'
                  }
                />
                {lockedEducationOrganization ? (
                  <p className="text-xs text-slate-500">
                    Значение задано администратором для этой публичной ссылки.
                  </p>
                ) : null}
              </div>
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
                  placeholder="10А, ИС-21..."
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20 p-4 text-sm">
              <p className="font-semibold text-foreground">
                Согласие на обработку персональных данных ({consentVersion})
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {consentText}
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={formState.consentAccepted}
                  onChange={(event) => onFieldChange('consentAccepted', event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-medium text-foreground">
                  Даю согласие на{' '}
                  <span className="text-primary">обработку персональных данных</span>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full bg-gradient-to-r from-primary to-accent font-medium shadow-md transition-all hover:from-primary/90 hover:to-accent/90 hover:shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Запускаем...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Перейти к тесту
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
