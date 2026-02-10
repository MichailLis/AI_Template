import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SnippetService } from './snippet.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { SnippetResponseDto } from './dto/snippet-response.dto';

@ApiTags('Snippet')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('snippets')
export class SnippetController {
  constructor(private readonly snippetService: SnippetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a snippet' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SnippetResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateSnippetDto) {
    return this.snippetService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user snippets' })
  @ApiResponse({ status: HttpStatus.OK, type: [SnippetResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.snippetService.findAll(userId);
  }
}
