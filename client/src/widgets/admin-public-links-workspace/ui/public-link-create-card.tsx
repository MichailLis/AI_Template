import { Link2 } from 'lucide-react';
import { useState } from 'react';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { PublicLinkAccessSettingsSection } from './public-link-access-settings-section';
import { PublicLinkOrganizationSection } from './public-link-organization-section';
import { PublicLinkTopicSection } from './public-link-topic-section';

import type { PublicLinkCreateCardProps } from './public-link-create-card.types';

interface PublicLinkCreateDialogProps extends PublicLinkCreateCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREATE_STEPS = [
  { title: 'Тест', description: 'Выберите опубликованный тест для публикации.' },
  { title: 'Учебное заведение', description: 'Привяжите ссылку к заведению или оставьте анкету.' },
  { title: 'Доступ', description: 'Настройте код, анкету и ограничения попытки.' },
];

function PublicLinkCreateHeader({ stepIndex }: { stepIndex: number }) {
  const step = CREATE_STEPS[stepIndex];

  return (
    <DialogHeader>
      <div className="flex items-start gap-3">
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
        >
          <Link2 className="size-5" />
        </div>
        <div className="min-w-0">
          <p className={adminClassNames.text.kicker}>
            Шаг {stepIndex + 1} из {CREATE_STEPS.length} · {step.title}
          </p>
          <DialogTitle>Создать публичную ссылку</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}

interface PublicLinkCreateWizardProps extends PublicLinkCreateCardProps {
  onCancel: () => void;
}

/**
 * Rendered only while the dialog is open: Radix unmounts the dialog content on close, so the
 * wizard always reopens on its first step without an effect resetting the state.
 */
function PublicLinkCreateWizard({ onCancel, ...props }: PublicLinkCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const isLastStep = stepIndex === CREATE_STEPS.length - 1;
  const canLeaveCurrentStep = stepIndex > 0 || props.hasPublishedVersion;

  return (
    <>
      <PublicLinkCreateHeader stepIndex={stepIndex} />

      <div className="grid gap-4">
        {stepIndex === 0 ? (
          <>
            <PublicLinkTopicSection {...props} />

            {!props.hasPublishedVersion ? (
              <p className={adminClassNames.panel.warningInline}>
                У выбранного теста нет опубликованной версии. Опубликуйте тест, чтобы создать
                публичную ссылку.
              </p>
            ) : null}
          </>
        ) : null}

        {stepIndex === 1 ? <PublicLinkOrganizationSection {...props} /> : null}

        {stepIndex === 2 ? <PublicLinkAccessSettingsSection {...props} /> : null}

        {isLastStep && props.createError ? (
          <p role="alert" className={adminClassNames.panel.dangerInline}>
            {props.createError}
          </p>
        ) : null}
      </div>

      <DialogFooter className="gap-2 sm:space-x-0 [&>button]:w-full sm:[&>button]:w-auto">
        <Button
          type="button"
          variant="outline"
          onClick={() => (stepIndex === 0 ? onCancel() : setStepIndex(stepIndex - 1))}
        >
          {stepIndex === 0 ? 'Отмена' : 'Назад'}
        </Button>
        {isLastStep ? (
          <Button
            type="button"
            onClick={props.onCreatePublicLink}
            disabled={props.isCreatingPublicLink || !props.hasPublishedVersion}
          >
            {props.isCreatingPublicLink ? 'Создаем...' : 'Создать ссылку'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setStepIndex(stepIndex + 1)}
            disabled={!canLeaveCurrentStep}
          >
            Далее
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function PublicLinkCreateDialog({
  open,
  onOpenChange,
  ...wizardProps
}: PublicLinkCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`left-4 right-4 top-4 max-h-[calc(100vh-2rem)] w-auto max-w-none translate-x-0 translate-y-0 overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:translate-x-[-50%] sm:p-6 ${adminClassNames.dialog.content}`}
      >
        <PublicLinkCreateWizard {...wizardProps} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
