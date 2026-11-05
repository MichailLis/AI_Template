import { Module } from '@nestjs/common';

import { AppSettingsModule } from '../../app-settings/app-settings.module';
import { ProfOrientationAtlasService } from './atlas';

/**
 * Атлас профессий методики prof-orientation-v3-plus: отчет о покрытии и обогащение сводки.
 * Один экземпляр на приложение: им пользуются и админка, и анализ попыток.
 */
@Module({
  imports: [AppSettingsModule],
  providers: [ProfOrientationAtlasService],
  exports: [ProfOrientationAtlasService],
})
export class ProfOrientationAtlasModule {}
