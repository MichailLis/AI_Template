import { PublicThemeLayout } from './public-theme-layout';

interface PublicTestRunStateScreenProps {
  message: string;
  tone?: 'default' | 'danger';
}

export function PublicTestRunStateScreen({
  message,
  tone = 'default',
}: PublicTestRunStateScreenProps) {
  return (
    <PublicThemeLayout containerClassName="max-w-4xl">
      <div
        className={`flex min-h-[60vh] items-center justify-center px-4 py-10 text-sm ${tone === 'danger' ? 'text-red-700' : 'text-muted-foreground'}`}
      >
        {message}
      </div>
    </PublicThemeLayout>
  );
}
