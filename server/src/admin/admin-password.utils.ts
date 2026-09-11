import { randomInt } from 'node:crypto';

// Без похожих друг на друга символов (0/O, 1/l/I): пароль админ диктует или пересылает вручную.
const TEMPORARY_PASSWORD_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TEMPORARY_PASSWORD_LENGTH = 12;

export const generateTemporaryPassword = () =>
  Array.from(
    { length: TEMPORARY_PASSWORD_LENGTH },
    () => TEMPORARY_PASSWORD_ALPHABET[randomInt(TEMPORARY_PASSWORD_ALPHABET.length)],
  ).join('');
