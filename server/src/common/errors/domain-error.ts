/**
 * Ошибка правил предметной области. Чистые функции и утилиты бросают её вместо HTTP-исключений
 * Nest: они не знают про транспорт, а машинный `code` и текст остаются теми же. В статус HTTP ошибку
 * переводит только `AllExceptionsFilter` (#167).
 */
export type DomainErrorKind =
  'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'UNAUTHENTICATED';

export class DomainError extends Error {
  constructor(
    readonly kind: DomainErrorKind,
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Данные не проходят правила: 400. */
export class InvalidInputError extends DomainError {
  constructor(message: string, code: string) {
    super('INVALID_INPUT', message, code);
  }
}

/** Сущности нет или она недоступна по этому адресу: 404. */
export class NotFoundError extends DomainError {
  constructor(message: string, code: string) {
    super('NOT_FOUND', message, code);
  }
}

/** Состояние изменилось, пока шла операция: 409. */
export class ConflictError extends DomainError {
  constructor(message: string, code: string) {
    super('CONFLICT', message, code);
  }
}

/** Нет прав на действие: 403. */
export class ForbiddenError extends DomainError {
  constructor(message: string, code: string) {
    super('FORBIDDEN', message, code);
  }
}

/** Сессия недействительна, нужен новый вход: 401. */
export class UnauthenticatedError extends DomainError {
  constructor(message: string, code: string) {
    super('UNAUTHENTICATED', message, code);
  }
}
