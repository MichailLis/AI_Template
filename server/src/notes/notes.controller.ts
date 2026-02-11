import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ type: NoteResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateNoteDto) {
    return this.notesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user notes' })
  @ApiResponse({ type: [NoteResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.notesService.findAll(userId);
  }
}
