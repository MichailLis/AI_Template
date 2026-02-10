import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';

@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@GetCurrentUserId() userId: number) {
    return this.categoryService.findAll(userId);
  }
}