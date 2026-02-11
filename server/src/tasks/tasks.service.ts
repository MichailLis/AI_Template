import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        userId,
      },
    });

    return {
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async findAll(userId: number): Promise<TaskResponseDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
  }

  async updateStatus(
    userId: number,
    taskId: number,
    dto: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    const existingTask = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { done: dto.done },
    });

    return {
      ...updatedTask,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString(),
    };
  }
}
