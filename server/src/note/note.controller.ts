import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
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
  @ApiResponse({ status: HttpStatus.CREATED, type: NoteResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateNoteDto) {
    return this.noteService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user notes' })
  @ApiResponse({ status: HttpStatus.OK, type: [NoteResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.noteService.findAll(userId);
  }
}
