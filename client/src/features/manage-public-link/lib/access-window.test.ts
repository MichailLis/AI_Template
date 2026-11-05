import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type * as AccessWindowModule from './access-window';

/**
 * Пояс фиксируется в Нью-Йорке (UTC-5 на 12.11.2026, летнее время уже закончилось): машина
 * разработчика может работать в другом поясе, и проверка должна проходить на любой. Модули
 * переимпортируются, потому что `Intl.DateTimeFormat` в `date-format` берет пояс в момент создания.
 */
describe('окно доступа в часовом поясе браузера', () => {
  let lib: typeof AccessWindowModule;

  beforeAll(async () => {
    vi.stubEnv('TZ', 'America/New_York');
    vi.resetModules();
    lib = await import('./access-window');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('перевод поля в ISO и обратно', () => {
    it('считает введенное время часами браузера и отдает ISO UTC с Z', () => {
      expect(lib.buildAccessWindowPayload({ startsAt: '2026-11-12T10:00', endsAt: '' })).toEqual({
        startsAt: '2026-11-12T15:00:00.000Z',
        endsAt: null,
      });
    });

    it('показывает ISO из сервера в часовом поясе браузера', () => {
      expect(
        lib.toAccessWindowValues({
          startsAt: '2026-11-12T15:00:00.000Z',
          endsAt: null,
        }),
      ).toEqual({ startsAt: '2026-11-12T10:00', endsAt: '' });
    });

    it('сохраняет исходный ISO, если минута не менялась, чтобы не обрезать секунды', () => {
      const original = { startsAt: '2026-11-12T15:00:30.000Z', endsAt: null };
      const values = lib.toAccessWindowValues(original);

      expect(lib.buildAccessWindowPayload(values, original).startsAt).toBe(original.startsAt);
    });

    it('пустое поле отправляет null, то есть снимает ограничение', () => {
      expect(lib.buildAccessWindowPayload({ startsAt: '', endsAt: '' })).toEqual({
        startsAt: null,
        endsAt: null,
      });
    });
  });

  describe('проверка порядка дат', () => {
    it('требует, чтобы «Закрыть в» было строго позже «Открыть с»', () => {
      expect(
        lib.validateAccessWindow({ startsAt: '2026-11-12T10:00', endsAt: '2026-11-12T10:00' }),
      ).toBe('Время «Закрыть в» должно быть позже «Открыть с».');
      expect(
        lib.validateAccessWindow({ startsAt: '2026-11-12T10:00', endsAt: '2026-11-12T09:59' }),
      ).not.toBeNull();
      expect(
        lib.validateAccessWindow({ startsAt: '2026-11-12T10:00', endsAt: '2026-11-12T10:45' }),
      ).toBeNull();
    });

    it('не проверяет окно, у которого не заполнено одно из полей', () => {
      expect(lib.validateAccessWindow({ startsAt: '', endsAt: '2026-11-12T09:00' })).toBeNull();
      expect(lib.validateAccessWindow({ startsAt: '2026-11-12T10:00', endsAt: '' })).toBeNull();
    });
  });

  describe('статус окна в списке', () => {
    // 10:00–10:45 по Нью-Йорку.
    const accessWindow = {
      startsAt: '2026-11-12T15:00:00.000Z',
      endsAt: '2026-11-12T15:45:00.000Z',
    };

    it('показывает дату открытия до начала окна по поясу браузера', () => {
      expect(lib.getAccessWindowStatus(accessWindow, new Date('2026-11-12T14:59:00.000Z'))).toEqual(
        {
          tone: 'upcoming',
          label: 'Откроется 12.11.2026, 10:00',
        },
      );
    });

    it('показывает, до какого времени открыта ссылка внутри окна', () => {
      expect(lib.getAccessWindowStatus(accessWindow, new Date('2026-11-12T15:30:00.000Z'))).toEqual(
        {
          tone: 'open',
          label: 'Открыта до 12.11.2026, 10:45',
        },
      );
    });

    it('совпадает с сервером на границе: в момент endsAt окно еще открыто', () => {
      expect(lib.getAccessWindowStatus(accessWindow, new Date(accessWindow.endsAt))).toMatchObject({
        tone: 'open',
      });
    });

    it('показывает дату закрытия после окна', () => {
      expect(lib.getAccessWindowStatus(accessWindow, new Date('2026-11-12T16:00:00.000Z'))).toEqual(
        {
          tone: 'closed',
          label: 'Закрыта 12.11.2026, 10:45',
        },
      );
    });

    it('не добавляет статуса, если окна нет или у него нет конца в прошлом', () => {
      expect(lib.getAccessWindowStatus({ startsAt: null, endsAt: null }, new Date())).toBeNull();
      expect(
        lib.getAccessWindowStatus(
          { startsAt: '2026-11-12T15:00:00.000Z', endsAt: null },
          new Date('2026-11-12T16:00:00.000Z'),
        ),
      ).toBeNull();
    });
  });
});
