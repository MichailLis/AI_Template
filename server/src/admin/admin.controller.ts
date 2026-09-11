import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { AdminUserCredentialsResponseDto } from './dto/admin-user-credentials-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
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

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user account' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminUserCredentialsResponseDto })
  createUser(@GetCurrentUserId() userId: number, @Body() dto: CreateUserDto) {
    return this.adminService.createUser(userId, dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user email and name' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserResponseDto })
  updateUser(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, targetUserId, dto);
  }

  @Post('users/:id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password and end their sessions' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserCredentialsResponseDto })
  resetUserPassword(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.adminService.resetUserPassword(userId, targetUserId, dto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserResponseDto })
  updateUserStatus(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(userId, targetUserId, dto);
  }

  @Post('users/:id/sessions/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End user sessions',
    description: 'Invalidates the refresh token; an issued access token expires within 15 minutes.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: AdminUserResponseDto })
  revokeUserSessions(
    @GetCurrentUserId() userId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
  ) {
    return this.adminService.revokeUserSessions(userId, targetUserId);
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
