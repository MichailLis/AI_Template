import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateNewsDto) {
    return this.prisma.news.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.news.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
