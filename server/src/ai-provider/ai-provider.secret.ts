import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';

/**
 * Ключ провайдера лежит в БД зашифрованным (AES-256-GCM), а не открытым текстом: дамп базы или
 * строка `app_settings` не раскрывают его. Ключ шифрования выводится из серверного секрета
 * (`JWT_REFRESH_SECRET`), поэтому смена этого секрета делает сохранённый ключ нечитаемым, и
 * его нужно ввести заново в админке (до тех пор действует ключ из env, если он задан).
 */
const deriveKey = (secret: string) => createHash('sha256').update(`ai-provider:${secret}`).digest();

export const encryptSecret = (plain: string, secret: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);

  return `${PREFIX}${[iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join(':')}`;
};

/** `null`, если значение испорчено или зашифровано другим секретом. */
export const decryptSecret = (stored: string, secret: string) => {
  if (!stored.startsWith(PREFIX)) {
    return null;
  }

  try {
    const [iv, tag, encrypted] = stored
      .slice(PREFIX.length)
      .split(':')
      .map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};
