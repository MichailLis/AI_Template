import { Download, FileSpreadsheet, FileText } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

type AnalyticsExportFormat = 'xlsx' | 'pdf';

interface TestAnalyticsExportActionsProps {
  canExport: boolean;
  exportingFormat: AnalyticsExportFormat | null;
  error: string | null;
  onExport: (format: AnalyticsExportFormat) => void;
}

export function TestAnalyticsExportActions({
  canExport,
  exportingFormat,
  error,
  onExport,
}: TestAnalyticsExportActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canExport || exportingFormat !== null}
          onClick={() => onExport('xlsx')}
        >
          <FileSpreadsheet />
          {exportingFormat === 'xlsx' ? 'Готовим XLSX...' : 'XLSX'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canExport || exportingFormat !== null}
          onClick={() => onExport('pdf')}
        >
          <FileText />
          {exportingFormat === 'pdf' ? 'Готовим PDF...' : 'PDF'}
        </Button>
      </div>
      {error ? (
        <p className={`text-xs ${adminClassNames.text.muted}`}>
          <Download className="mr-1 inline size-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
