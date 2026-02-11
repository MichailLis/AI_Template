import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const hashedPassword = await argon2.hash('admin');

const user = await prisma.user.create({
  data: {
    email: 'admin@admin.admin',
    name: 'admin',
    password: hashedPassword,
    role: 'ADMIN',
  },
});

console.log('Admin created:', { id: user.id, email: user.email, name: user.name });
await prisma.$disconnect();
