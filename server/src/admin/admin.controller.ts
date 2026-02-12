import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { AdminOverviewResponseDto } from './dto/admin-overview-response.dto';

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
}
