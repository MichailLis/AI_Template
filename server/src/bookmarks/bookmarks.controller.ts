import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUserId } from '../auth/decorators';
import { BookmarksService } from './bookmarks.service';
import { AtGuard } from '../auth/guards';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bookmark' })
  @ApiResponse({ type: BookmarkResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user bookmarks' })
  @ApiResponse({ type: [BookmarkResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.bookmarksService.findAll(userId);
  }
}
