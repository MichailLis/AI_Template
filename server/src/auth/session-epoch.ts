/**
 * Момент, раньше которого выданные access-токены недействительны. Сдвигается восстановлением
 * базы: после него id в токене может принадлежать другому пользователю, а 15 минут жизни токена
 * без такой границы оставили бы старые сессии рабочими. Хранится в памяти процесса; модуль
 * бэкапов поднимает значение из тома при старте.
 */
let sessionEpochMs = 0;

export const getSessionEpochMs = () => sessionEpochMs;

export const setSessionEpochMs = (value: number) => {
  sessionEpochMs = Math.max(sessionEpochMs, value);
};
