import { Sparkles } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import type { FormEvent } from 'react';

interface PublicTestAnonymousStartCardProps {
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Анонимная ссылка: ни анкеты, ни согласия. Старт только по кнопке — превью-боты не создают попыток. */
export function PublicTestAnonymousStartCard({
  isSubmitting,
  onSubmit,
}: PublicTestAnonymousStartCardProps) {
  return (
    <div className="order-1 lg:order-2">
      <Card className="relative overflow-hidden border border-border/60 bg-card shadow-xl lg:sticky lg:top-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r/srgb from-primary via-accent to-secondary" />
        <CardHeader className="space-y-1 pb-4 pt-6">
          <CardTitle className="text-2xl font-bold">Готовы начать?</CardTitle>
          <CardDescription>Анонимный тест: личные данные не запрашиваются</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={onSubmit}>
            <Button type="submit" disabled={isSubmitting} className="h-12 w-full font-medium">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {isSubmitting ? 'Запускаем тест...' : 'Начать'}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
