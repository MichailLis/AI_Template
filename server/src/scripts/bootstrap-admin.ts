import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as pg from 'pg';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Administrator';
const resetPassword = process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === 'true';

const fail = (message: string) => {
  console.error(`[bootstrap-admin] ${message}`);
  process.exitCode = 1;
};

/**
 * Скрипт запускается при каждом старте контейнера. Роль существующего пользователя не трогаем:
 * иначе понижение bootstrap-аккаунта откатывалось бы при следующем деплое. Сброс пароля
 * отзывает refresh-сессии, выданные со старым паролем.
 */
export const planExistingUserUpdates = (
  existing: { name: string | null },
  options: { name: string; hashedPassword: string | null },
) => {
  const updates: { password?: string; hashedRefreshToken?: null; name?: string } = {};
  if (options.hashedPassword) {
    updates.password = options.hashedPassword;
    updates.hashedRefreshToken = null;
  }
  if (!existing.name && options.name) updates.name = options.name;
  return updates;
};

const main = async () => {
  if (!email && !password) {
    console.log('[bootstrap-admin] BOOTSTRAP_ADMIN_EMAIL is not set, skipping admin bootstrap.');
    return;
  }

  if (!email || !password) {
    fail('Both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set.');
    return;
  }

  if (password.length < 8) {
    fail('BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters long.');
    return;
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name,
          password: await argon2.hash(password),
          role: 'ADMIN',
        },
      });
      console.log(`[bootstrap-admin] Created admin user ${email}.`);
      return;
    }

    const updates = planExistingUserUpdates(existing, {
      name,
      hashedPassword: resetPassword ? await argon2.hash(password) : null,
    });

    if (Object.keys(updates).length === 0) {
      console.log(`[bootstrap-admin] Admin user ${email} already exists, no changes needed.`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: updates,
    });
    console.log(`[bootstrap-admin] Updated admin user ${email}.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
};

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('[bootstrap-admin] Failed to bootstrap admin user.');
    console.error(error);
    process.exitCode = 1;
  });
}
