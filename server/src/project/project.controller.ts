import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';

@ApiTags('Project')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateProjectDto) {
    return this.projectService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user projects' })
  findAll(@GetCurrentUserId() userId: number) {
    return this.projectService.findAll(userId);
  }
}
