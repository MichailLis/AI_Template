import type { Role } from '@prisma/client';
import * as argon2 from 'argon2';

import type { PrismaService } from '../../src/prisma.service';

type CreateE2eUserInput = {
  email: string;
  password: string;
  name?: string;
  role?: Role;
};

/**
 * Public signup is closed — accounts exist only when an admin creates them — so suites seed their
 * users straight into the database. Emails must already be lowercase, as AuthService stores them.
 */
export const createE2eUser = async (
  prisma: PrismaService,
  { email, password, name, role = 'USER' }: CreateE2eUserInput,
) =>
  prisma.user.create({
    data: { email, name, role, password: await argon2.hash(password) },
    select: { id: true },
  });
