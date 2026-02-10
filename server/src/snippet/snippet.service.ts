import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';

@Injectable()
export class SnippetService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateSnippetDto) {
    return this.prisma.snippet.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.snippet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
