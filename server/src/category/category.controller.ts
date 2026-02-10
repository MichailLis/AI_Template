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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
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
  @ApiResponse({ status: HttpStatus.CREATED, type: CategoryResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: HttpStatus.OK, type: [CategoryResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.categoryService.findAll(userId);
  }
}
