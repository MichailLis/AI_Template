import { Module } from '@nestjs/common';

import { TestsAttemptsModule } from './tests-attempts.module';
import { TestsPublicLinksModule } from './tests-public-links.module';
import { TestsTopicsModule } from './tests-topics.module';

@Module({
  imports: [TestsTopicsModule, TestsPublicLinksModule, TestsAttemptsModule],
})
export class TestsModule {}
