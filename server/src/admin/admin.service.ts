import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: number) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        name: true,
        email: true,
      },
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admin area only');
    }

    const [totalUsers, totalAdmins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      title: 'Admin Console',
      subtitle: `Signed in as ${currentUser.name ?? currentUser.email}`,
      cards: [
        {
          id: 'users-total',
          label: 'Total users',
          value: totalUsers,
          trend: 'Live system metric',
        },
        {
          id: 'admins-total',
          label: 'Admin accounts',
          value: totalAdmins,
          trend: 'Role-based access baseline',
        },
      ],
      shortcuts: [
        {
          id: 'health-check',
          label: 'Health checks',
          hint: 'Use this block for system probes and smoke checks.',
          path: '/admin',
        },
        {
          id: 'user-audit',
          label: 'User audit',
          hint: 'Wire user management actions here in the next iteration.',
          path: '/admin',
        },
      ],
    };
  }
}
