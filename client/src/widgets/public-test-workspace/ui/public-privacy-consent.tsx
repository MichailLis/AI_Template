import { cn } from '@/shared/lib/utils';

import { getPublicDocumentLinkProps } from './public-document-link';

import type { PublicLinkAccessResponseDtoPersonalData } from '@/shared/api/model';

interface PublicPrivacyConsentProps {
  checked: boolean;
  className?: string;
  personalData: PublicLinkAccessResponseDtoPersonalData;
  onCheckedChange: (checked: boolean) => void;
}

export function PublicPrivacyConsent({
  checked,
  className,
  personalData,
  onCheckedChange,
}: PublicPrivacyConsentProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-md border border-border/70 bg-background/80 p-3 text-sm leading-6 text-foreground shadow-sm',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        required
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <span>
        Я ознакомлен(а) с{' '}
        <a
          href={personalData.privacyPolicyUrl}
          {...getPublicDocumentLinkProps(personalData.privacyPolicyUrl)}
          className="font-medium text-primary underline underline-offset-4"
        >
          Политикой обработки персональных данных
        </a>{' '}
        и{' '}
        {personalData.consentDocumentUrl ? (
          <a
            href={personalData.consentDocumentUrl}
            {...getPublicDocumentLinkProps(personalData.consentDocumentUrl)}
            className="font-medium text-primary underline underline-offset-4"
          >
            даю согласие на обработку персональных данных
          </a>
        ) : (
          'даю согласие на обработку персональных данных'
        )}
        .
      </span>
    </label>
  );
}
