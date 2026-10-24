import { BadRequestException, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter';

interface ErrorContractBody {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
}

const createHttpHost = (extraRequest: object = {}, url = '/contract-test') => {
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
    method: 'GET',
    url,
    ...extraRequest,
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

  it('answers body-parser errors with their own 4xx status instead of 500', () => {
    const filter = new AllExceptionsFilter();
    const { host, jsonMock, statusMock } = createHttpHost();

    filter.catch({ status: 413, type: 'entity.too.large', message: 'raw' }, host);
    const body = jsonMock.mock.calls[0]?.[0];

    expect(statusMock).toHaveBeenCalledWith(413);
    expect(body?.success).toBe(false);
    expect(body?.error.code).toBe('entity.too.large');
    expect(body?.error.message).toBe('Request body is too large');
  });

  it('keeps 400 for malformed JSON bodies', () => {
    const filter = new AllExceptionsFilter();
    const { host, statusMock } = createHttpHost();

    filter.catch({ status: 400, type: 'entity.parse.failed' }, host);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('logs 5xx with the stack and the route template, never the URL', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const filter = new AllExceptionsFilter();
    const { host, statusMock } = createHttpHost(
      { route: { path: '/t/:token' } },
      '/t/secret-token',
    );
    const error = new Error('boom');

    filter.catch(error, host);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(errorSpy).toHaveBeenCalledWith('GET /t/:token -> 500', error.stack);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('secret-token');
    errorSpy.mockRestore();
  });

  it('does not log 4xx', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const filter = new AllExceptionsFilter();
    const { host } = createHttpHost();

    filter.catch(new BadRequestException('nope'), host);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
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
