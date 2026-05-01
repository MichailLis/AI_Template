import { Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface PublicTestAnalysisArchetypeCardProps {
  title: string;
  description: string;
}

export function PublicTestAnalysisArchetypeCard({
  title,
  description,
}: PublicTestAnalysisArchetypeCardProps) {
  return (
    <Card className="h-full border-border/60 bg-card/90 shadow-sm ring-1 ring-primary/25">
      <CardHeader className="pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Ваш профиль
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="text-2xl font-semibold leading-tight text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
