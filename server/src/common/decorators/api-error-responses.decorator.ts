import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { ErrorResponseDto } from '../dto/error-response.dto';

const protectedErrorStatuses = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.CONFLICT,
  HttpStatus.INTERNAL_SERVER_ERROR,
] as const;

const publicErrorStatuses = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.NOT_FOUND,
  HttpStatus.INTERNAL_SERVER_ERROR,
] as const;

export const ApiErrorResponses = (statuses: readonly HttpStatus[] = protectedErrorStatuses) =>
  applyDecorators(...statuses.map((status) => ApiResponse({ status, type: ErrorResponseDto })));

export const ApiPublicErrorResponses = () => ApiErrorResponses(publicErrorStatuses);
