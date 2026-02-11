import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CalculatorService } from './calculator.service';
import { AtGuard } from '../auth/guards';
import { GetCurrentUserId } from '../auth/decorators';
import { CreateCalculationDto } from './dto/create-calculation.dto';
import { CalculationResponseDto } from './dto/calculation-response.dto';

@ApiTags('Calculator')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post()
  @ApiOperation({ summary: 'Save a calculation result' })
  @ApiResponse({ type: CalculationResponseDto })
  create(
    @GetCurrentUserId() userId: number,
    @Body() dto: CreateCalculationDto,
  ) {
    return this.calculatorService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get calculation history' })
  @ApiResponse({ type: [CalculationResponseDto] })
  findAll(@GetCurrentUserId() userId: number) {
    return this.calculatorService.findAll(userId);
  }
}
