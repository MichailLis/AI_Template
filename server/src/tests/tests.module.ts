import { Module } from '@nestjs/common';

import { TestsAttemptsModule } from './tests-attempts.module';
import { TestsPublicLinksModule } from './public-links/public-links.module';
import { TestsTopicsModule } from './topics/topics.module';

@Module({
  imports: [TestsTopicsModule, TestsPublicLinksModule, TestsAttemptsModule],
})
export class TestsModule {}
