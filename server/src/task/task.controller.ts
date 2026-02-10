import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';

@ApiTags('Task')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateTaskDto) {
    return this.taskService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user tasks' })
  findAll(@GetCurrentUserId() userId: number) {
    return this.taskService.findAll(userId);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle task completion' })
  toggle(@Param('id') id: string) {
    return this.taskService.toggle(+id);
  }
}