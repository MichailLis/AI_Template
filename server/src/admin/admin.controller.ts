import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { AdminOverviewResponseDto } from './dto/admin-overview-response.dto';
import { AdminUsersResponseDto } from './dto/admin-users-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminPromptModelsResponseDto } from './dto/admin-prompt-models-response.dto';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { AdminPromptResponseDto } from './dto/admin-prompt-response.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminOverviewResponseDto })
  getOverview(@GetCurrentUserId() userId: number) {
    return this.adminService.getOverview(userId);
  }

  @Get('users')
  @ApiOperation({ summary: 'List users for admin management' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUsersResponseDto })
  getUsers(@GetCurrentUserId() userId: number, @Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(userId, query);
  }

  @Get('prompts/models')
  @ApiOperation({ summary: 'Get available OpenRouter models' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPromptModelsResponseDto })
  getPromptModels(@GetCurrentUserId() userId: number) {
    return this.adminService.getPromptModels(userId);
  }

  @Post('prompts/generate')
  @ApiOperation({ summary: 'Generate response from prompt via OpenRouter' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPromptResponseDto })
  generatePrompt(@GetCurrentUserId() userId: number, @Body() dto: GeneratePromptDto) {
    return this.adminService.generatePrompt(userId, dto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserResponseDto })
  updateUserRole(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, targetUserId, dto);
  }
}
