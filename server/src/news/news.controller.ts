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
import { NewsService } from './news.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';

@ApiTags('News')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create news' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NewsResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateNewsDto) {
    return this.newsService.create(userId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user news' })
  @ApiResponse({ status: HttpStatus.OK, type: [NewsResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.newsService.findAll(userId);
  }
}
