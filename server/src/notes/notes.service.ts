import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateNoteDto): Promise<NoteResponseDto> {
    const note = await this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        userId,
      },
    });
    return {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  async findAll(userId: number): Promise<NoteResponseDto[]> {
    const notes = await this.prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));
  }
}
