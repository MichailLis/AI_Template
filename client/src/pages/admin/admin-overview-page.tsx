import { useOutletContext } from 'react-router-dom';

import { AdminOverview } from '@/features/admin';

import type { AdminOutletContext } from '@/widgets/admin-page-layout';

export default function AdminOverviewPage() {
  const { overview } = useOutletContext<AdminOutletContext>();

  return (
    <AdminOverview
      title={overview.title}
      subtitle={overview.subtitle}
      cards={overview.cards}
      shortcuts={overview.shortcuts}
    />
  );
}
