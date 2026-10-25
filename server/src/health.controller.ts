import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Container healthchecks and the maintenance allowlist: no database call, so it answers during a restore.
@ApiExcludeController()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Backend process is up' })
  getHealth() {
    return { status: 'ok' };
  }
}
