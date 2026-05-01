import { Injectable } from '@nestjs/common';

import type {
  PublicSessionSaveAnswersRequestDto,
  PublicSessionStartRequestDto,
} from './dto/tests-public.dto';
import type { AdminPublicAttemptsListQueryDto } from './dto/tests-links.dto';
import { TestsAdminAttemptService } from './tests-admin-attempt.service';
import { TestsPublicSessionService } from './tests-public-session.service';

@Injectable()
export class TestsAttemptService {
  constructor(
    private readonly publicSessionService: TestsPublicSessionService,
    private readonly adminAttemptService: TestsAdminAttemptService,
  ) {}

  startSessionByCode(shortCode: string, dto: PublicSessionStartRequestDto) {
    return this.publicSessionService.startSessionByCode(shortCode, dto);
  }

  getSessionByToken(sessionToken: string) {
    return this.publicSessionService.getSessionByToken(sessionToken);
  }

  saveAnswers(sessionToken: string, dto: PublicSessionSaveAnswersRequestDto) {
    return this.publicSessionService.saveAnswers(sessionToken, dto);
  }

  finishSession(sessionToken: string) {
    return this.publicSessionService.finishSession(sessionToken);
  }

  getSessionResult(sessionToken: string) {
    return this.publicSessionService.getSessionResult(sessionToken);
  }

  listAttemptsForLink(userId: number, linkId: number, query: AdminPublicAttemptsListQueryDto) {
    return this.adminAttemptService.listAttemptsForLink(userId, linkId, query);
  }

  getAttemptDetail(userId: number, attemptId: number) {
    return this.adminAttemptService.getAttemptDetail(userId, attemptId);
  }
}
