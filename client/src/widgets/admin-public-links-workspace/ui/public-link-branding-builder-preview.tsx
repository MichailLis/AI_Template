import {
  MousePointerClick,
  Palette,
  PanelTop,
  PaintBucket,
  SquareMousePointer,
} from 'lucide-react';

import { PublicThemeLayout } from '@/features/tests';
import { Button } from '@/shared/ui/button';

import { ZoneButton } from './public-link-branding-builder-zone-button';
import { brandingPreviewQuestion } from './public-link-branding-builder.fixtures';

import type { BrandingPreviewProps } from './public-link-branding-builder.types';

export function BrandingPreview({ draft, link, previewState, onEditPanel }: BrandingPreviewProps) {
  const headerSlot = (
    <ZoneButton icon={PanelTop} label="Логотипы" onClick={() => onEditPanel('header')} />
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="absolute left-3 top-3 z-20">
        <ZoneButton icon={PaintBucket} label="Фон" onClick={() => onEditPanel('background')} />
      </div>

      <div className="max-h-[68vh] overflow-auto">
        <PublicThemeLayout
          branding={draft}
          builderHeaderSlot={headerSlot}
          containerClassName="max-w-5xl pt-16"
        >
          {previewState === 'start' ? (
            <div className="grid min-h-[34rem] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
              <section className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Готовность к старту
                </p>
                <h1 className="text-4xl font-black leading-tight text-foreground">{link.title}</h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  Превью стартового экрана публичного теста с выбранной цветовой схемой.
                </p>
                <div>
                  <ZoneButton
                    icon={MousePointerClick}
                    label="Кнопки"
                    onClick={() => onEditPanel('buttons')}
                  />
                </div>
                <Button type="button" className="rounded-xl px-6">
                  Начать тест
                </Button>
              </section>

              <aside className="public-glass space-y-4 rounded-2xl p-5">
                <div className="flex justify-end">
                  <ZoneButton
                    icon={SquareMousePointer}
                    label="Карточка"
                    onClick={() => onEditPanel('surfaces')}
                  />
                </div>
                <div className="rounded-xl bg-primary/10 p-4 text-primary">
                  <Palette className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Этот блок показывает фон карточек, рамки и мягкие поверхности.
                </p>
              </aside>
            </div>
          ) : null}

          {previewState === 'question' ? (
            <div className="grid min-h-[34rem] place-items-center">
              <section className="public-glass w-full max-w-2xl space-y-5 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-muted-foreground">Вопрос 1 из 3</p>
                  <ZoneButton icon={Palette} label="Акцент" onClick={() => onEditPanel('accent')} />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {brandingPreviewQuestion.title}
                </h2>
                <div className="space-y-3">
                  {brandingPreviewQuestion.options.map((option, index) => (
                    <div
                      key={option}
                      className={`rounded-xl border p-3 text-sm ${
                        index === 0
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card/80 text-muted-foreground'
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {previewState === 'result' ? (
            <div className="grid min-h-[34rem] place-items-center">
              <section className="public-glass w-full max-w-3xl space-y-5 rounded-2xl p-6">
                <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
                  <p className="text-sm font-semibold opacity-80">Результат</p>
                  <h2 className="mt-2 text-3xl font-black">Персональный отчет готов</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {['Профиль', 'Сильная зона', 'Следующий шаг'].map((label) => (
                    <div key={label} className="rounded-xl border border-border bg-card/85 p-4">
                      <p className="text-xs font-semibold uppercase text-primary">{label}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Пример блока результата</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </PublicThemeLayout>
      </div>
    </div>
  );
}
