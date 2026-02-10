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
import { BookmarkService } from './bookmark.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';

@ApiTags('Bookmark')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bookmark' })
  @ApiResponse({ status: HttpStatus.CREATED, type: BookmarkResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateBookmarkDto) {
    return this.bookmarkService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user bookmarks' })
  @ApiResponse({ status: HttpStatus.OK, type: [BookmarkResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.bookmarkService.findAll(userId);
  }
}
