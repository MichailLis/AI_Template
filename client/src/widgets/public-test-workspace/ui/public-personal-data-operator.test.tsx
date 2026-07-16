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

  it('shows the platform operator without duplicating the privacy policy link', () => {
    render(<PublicPersonalDataOperator personalData={publicPersonalData} />);

    expect(screen.getByText('ООО «Платформа диагностики»')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /политика обработки/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('names the represented organization without duplicating document links', () => {
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
    expect(screen.queryByRole('link', { name: /политика обработки/i })).not.toBeInTheDocument();
  });
});
