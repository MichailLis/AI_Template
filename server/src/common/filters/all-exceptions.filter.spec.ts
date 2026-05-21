import { BadRequestException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter';

interface ErrorContractBody {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
}

const createHttpHost = () => {
  const statusMock = jest.fn();
  const jsonMock = jest.fn((body: ErrorContractBody) => body);
  const response = {
    status: (statusCode: number) => {
      statusMock(statusCode);
      return response;
    },
    json: jsonMock,
  };
  const request = {
    url: '/contract-test',
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, jsonMock, statusMock };
};

describe('AllExceptionsFilter', () => {
  it('returns the canonical error object with code and message for HTTP exceptions', () => {
    const filter = new AllExceptionsFilter();
    const { host, jsonMock, statusMock } = createHttpHost();

    filter.catch(new BadRequestException('Human message'), host);
    const body = jsonMock.mock.calls[0]?.[0];

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(body?.success).toBe(false);
    expect(body?.error.code).toBe('Bad Request');
    expect(body?.error.message).toBe('Human message');
  });

  it('maps Prisma unique errors to the canonical error object', () => {
    const filter = new AllExceptionsFilter();
    const { host, jsonMock, statusMock } = createHttpHost();

    filter.catch({ code: 'P2002', meta: { target: ['email'] } }, host);
    const body = jsonMock.mock.calls[0]?.[0];

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(body?.success).toBe(false);
    expect(body?.error.code).toBe('DB_UNIQUE_CONSTRAINT');
    expect(body?.error.message).toBe('Unique constraint failed on field: email');
  });
});
