import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    dto: CreateBookmarkDto,
  ): Promise<BookmarkResponseDto> {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        title: dto.title,
        url: dto.url,
        userId,
      },
    });

    return {
      ...bookmark,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
    };
  }

  async findAll(userId: number): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map((bookmark) => ({
      ...bookmark,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
    }));
  }
}
