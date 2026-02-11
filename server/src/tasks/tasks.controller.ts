import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ type: TaskResponseDto })
  create(@GetCurrentUserId() userId: number, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user tasks' })
  @ApiResponse({ type: [TaskResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.tasksService.findAll(userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ type: TaskResponseDto })
  updateStatus(
    @GetCurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(userId, Number(id), dto);
  }
}
