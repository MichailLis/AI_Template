import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';

@ApiTags('Note')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a note' })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateNoteDto) {
    return this.noteService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user notes' })
  findAll(@GetCurrentUserId() userId: number) {
    return this.noteService.findAll(userId);
  }
}