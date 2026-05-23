import {
  MetricGrid,
  OverviewHero,
  OverviewNotice,
  ReadinessPanel,
  ShortcutPanel,
} from './admin-overview.panels';

import type { AdminOverviewProps } from './admin-overview.model';

export const AdminOverview = ({ title, subtitle, cards, shortcuts }: AdminOverviewProps) => {
  const totalTracked = cards.reduce((acc, item) => acc + item.value, 0);
  const primaryShortcut = shortcuts.find((item) => item.path !== '/admin') ?? shortcuts[0];

  return (
    <div className="flex flex-col gap-6">
      <OverviewHero
        title={title}
        subtitle={subtitle}
        totalTracked={totalTracked}
        primaryShortcut={primaryShortcut}
      />

      <MetricGrid cards={cards} />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ShortcutPanel shortcuts={shortcuts} />
        <ReadinessPanel totalTracked={totalTracked} />
      </div>

      <OverviewNotice />
    </div>
  );
};
