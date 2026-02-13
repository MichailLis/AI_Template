import { useOutletContext } from 'react-router-dom';

import { AdminOverview } from '@/features/admin/ui/admin-overview';

import type { AdminOutletContext } from './admin-page';

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
