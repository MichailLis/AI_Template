import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PublicPersonalDataOperator } from './public-personal-data-operator';

import type { PublicLinkAccessResponseDtoPersonalData } from '@/shared/api/model';

const publicPersonalData: PublicLinkAccessResponseDtoPersonalData = {
  processingMode: 'PUBLIC',
  operatorFullName: 'ООО «Платформа диагностики»',
  operatorShortName: 'Платформа',
  privacyPolicyUrl: '/privacy',
  consentDocumentUrl: null,
  logoUrl: null,
};

describe('PublicPersonalDataOperator', () => {
  afterEach(cleanup);

  it('shows the platform operator and keeps its local privacy policy in the same tab', () => {
    render(<PublicPersonalDataOperator personalData={publicPersonalData} />);

    expect(screen.getByText('ООО «Платформа диагностики»')).toBeInTheDocument();
    const policyLink = screen.getByRole('link', { name: /политика обработки/i });
    expect(policyLink).toHaveAttribute('href', '/privacy');
    expect(policyLink).not.toHaveAttribute('target');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('names the represented organization and safely opens its external documents', () => {
    const personalData: PublicLinkAccessResponseDtoPersonalData = {
      processingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullName: 'Государственное бюджетное общеобразовательное учреждение «Лицей № 1»',
      operatorShortName: 'Лицей № 1',
      privacyPolicyUrl: 'https://school.example/privacy',
      consentDocumentUrl: 'https://school.example/consent',
      logoUrl: 'https://school.example/logo.svg',
    };

    render(<PublicPersonalDataOperator personalData={personalData} />);

    expect(
      screen.getByText(/обработка персональных данных осуществляется от имени/i),
    ).toBeInTheDocument();
    expect(screen.getByText(personalData.operatorFullName)).toBeInTheDocument();
    expect(screen.getByText(personalData.operatorShortName!)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /логотип лицей № 1/i })).toHaveAttribute(
      'src',
      personalData.logoUrl,
    );
    expect(screen.getByRole('link', { name: /политика обработки/i })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('link', { name: /политика обработки/i })).toHaveAttribute(
      'rel',
      'noreferrer',
    );
  });
});
