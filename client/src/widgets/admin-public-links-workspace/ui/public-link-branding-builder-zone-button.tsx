import { Button } from '@/shared/ui/button';

import type { LucideIcon } from 'lucide-react';

interface ZoneButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function ZoneButton({ icon: Icon, label, onClick }: ZoneButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="h-8 gap-1.5 border border-border/70 bg-card/95 px-2.5 text-xs text-foreground shadow-sm backdrop-blur hover:text-foreground"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Button>
  );
}
