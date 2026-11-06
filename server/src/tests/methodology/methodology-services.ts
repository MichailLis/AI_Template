import { Injectable } from '@nestjs/common';

import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';

/**
 * Единственная точка внедрения зависимостей методик: хуки `afterFinish` получают её аргументом,
 * поэтому реестр остаётся обычным объектом, а общий контур не знает про сервисы конкретной методики.
 */
@Injectable()
export class MethodologyServices {
  constructor(readonly atlas: ProfOrientationAtlasService) {}
}
