import { Body, Controller, Get, Param, Patch, Post, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
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
  @ApiResponse({ status: HttpStatus.CREATED, type: TaskResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateTaskDto) {
    return this.taskService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user tasks' })
  @ApiResponse({ status: HttpStatus.OK, type: [TaskResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.taskService.findAll(userId);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle task completion' })
  @ApiResponse({ status: HttpStatus.OK, type: TaskResponseDto })
  toggle(@Param('id') id: string) {
    return this.taskService.toggle(+id);
  }
}
