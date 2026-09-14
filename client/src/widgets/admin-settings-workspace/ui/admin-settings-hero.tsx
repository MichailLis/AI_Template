import { SlidersHorizontal } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';

import type { IntegrationHealthBadge, IntegrationHealthTone } from './admin-settings-cards.model';

const integrationBadgeClassNames: Record<IntegrationHealthTone, string> = {
  success: adminBadgeClassNames.success,
  warning: adminBadgeClassNames.warning,
  danger: adminBadgeClassNames.danger,
  neutral: adminBadgeClassNames.neutral,
};

/**
 * Шапка настроек. Бейджи показывают результат проверки связи (см. `getOpenRouterHealthBadge` и
 * `getProfessionAtlasHealthBadge`), а не наличие настроек: раньше здесь стояло «OpenRouter готов»
 * и «Атлас подключен», пока ниже на той же странице атлас был «Недоступен · fetch failed».
 */
export function AdminSettingsHero({
  openRouterBadge,
  professionAtlasBadge,
}: {
  openRouterBadge: IntegrationHealthBadge;
  professionAtlasBadge: IntegrationHealthBadge;
}) {
  return (
    <div className={`${adminClassNames.panel.hero} rounded-xl p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${adminToneClassNames.accent.icon}`}
          >
            <SlidersHorizontal className="size-5" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-2xl font-semibold tracking-normal ${adminClassNames.text.heading}`}
            >
              Настройки
            </h1>
            <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
              OpenRouter используется для анализа ответов. Атлас профессий показывается на публичной
              странице результата.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge variant="outline" className={integrationBadgeClassNames[openRouterBadge.tone]}>
            {openRouterBadge.label}
          </Badge>
          <Badge
            variant="outline"
            className={integrationBadgeClassNames[professionAtlasBadge.tone]}
          >
            {professionAtlasBadge.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}
