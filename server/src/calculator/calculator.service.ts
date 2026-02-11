import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCalculationDto } from './dto/create-calculation.dto';
import { CalculationResponseDto } from './dto/calculation-response.dto';

@Injectable()
export class CalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    dto: CreateCalculationDto,
  ): Promise<CalculationResponseDto> {
    const calc = await this.prisma.calculation.create({
      data: {
        expression: dto.expression,
        result: dto.result,
        userId,
      },
    });
    return {
      ...calc,
      createdAt: calc.createdAt.toISOString(),
    };
  }

  async findAll(userId: number): Promise<CalculationResponseDto[]> {
    const calculations = await this.prisma.calculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return calculations.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }));
  }
}
