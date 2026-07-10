import { cn } from '@/shared/lib/utils';

import type { PublicLinkAccessResponseDtoPersonalData } from '@/shared/api/model';

interface PublicPersonalDataOperatorProps {
  personalData: PublicLinkAccessResponseDtoPersonalData;
  className?: string;
}

export function PublicPersonalDataOperator({
  personalData,
  className,
}: PublicPersonalDataOperatorProps) {
  const isProcessingOnBehalf =
    personalData.processingMode === 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';
  const displayName = personalData.operatorShortName ?? personalData.operatorFullName;

  return (
    <section
      aria-label="Оператор персональных данных"
      className={cn(
        'flex items-start gap-3 rounded-md border border-border/70 bg-background/80 p-3 text-sm leading-5 text-foreground shadow-sm',
        className,
      )}
    >
      {personalData.logoUrl ? (
        <img
          src={personalData.logoUrl}
          alt={`Логотип ${displayName}`}
          className="h-10 w-10 shrink-0 rounded object-contain"
        />
      ) : null}
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Оператор персональных данных
        </p>
        {isProcessingOnBehalf ? (
          <>
            <p>Обработка персональных данных осуществляется от имени:</p>
            {personalData.operatorShortName ? (
              <p className="font-semibold">{personalData.operatorShortName}</p>
            ) : null}
            <p className="text-muted-foreground">{personalData.operatorFullName}</p>
          </>
        ) : (
          <p className="font-semibold">{personalData.operatorFullName}</p>
        )}
      </div>
    </section>
  );
}
