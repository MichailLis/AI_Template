import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.project.findMany({
      where: { userId },
    });
  }
}
