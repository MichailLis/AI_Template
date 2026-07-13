import { RefreshCcw } from 'lucide-react';

import { usePrivacyPolicyControllerGetPrivacyPolicy } from '@/shared/api/generated/privacy-policy/privacy-policy';
import { Button } from '@/shared/ui/button';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

const splitPolicyBlocks = (content: string) => {
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trimEnd();
    if (line.trim().length === 0) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n').trim());
        currentBlock = [];
      }
      continue;
    }
    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n').trim());
  }

  return blocks;
};

const hasNumberedHeadingPrefix = (block: string) => {
  let hasDigit = false;
  let lastWasDot = false;
  let index = 0;

  while (index < block.length) {
    const char = block[index];
    if (char >= '0' && char <= '9') {
      hasDigit = true;
      lastWasDot = false;
      index += 1;
      continue;
    }
    if (char === '.') {
      if (!hasDigit) {
        return false;
      }
      lastWasDot = true;
      index += 1;
      continue;
    }
    break;
  }

  return hasDigit && lastWasDot && block[index] === ' ';
};

const hasUppercaseCyrillic = (value: string) => {
  for (const char of value) {
    if ((char >= 'А' && char <= 'Я') || char === 'Ё') {
      return true;
    }
  }
  return false;
};

const isSectionHeading = (block: string) =>
  block.length <= 120 &&
  (hasNumberedHeadingPrefix(block) ||
    (block === block.toUpperCase() && hasUppercaseCyrillic(block)));

function PrivacyLoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-700">
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        Загружаем политику...
      </div>
    </main>
  );
}

function PrivacyErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal">Политика временно недоступна</h1>
        <p className="text-sm text-slate-600">
          Не удалось загрузить актуальную редакцию политики обработки персональных данных.
        </p>
        <Button type="button" variant="outline" className="w-fit" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" />
          Повторить
        </Button>
      </div>
    </main>
  );
}

export default function PrivacyPage() {
  const privacyPolicyQuery = usePrivacyPolicyControllerGetPrivacyPolicy();
  const policy = privacyPolicyQuery.data?.privacyPolicy;

  if (privacyPolicyQuery.isLoading) {
    return <PrivacyLoadingState />;
  }

  if (privacyPolicyQuery.isError || !policy) {
    return (
      <PrivacyErrorState
        onRetry={() => {
          void privacyPolicyQuery.refetch();
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <article className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-semibold tracking-normal">
            Политика обработки персональных данных
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>Версия: {policy.version}</span>
            <span>Опубликована: {formatDate(policy.publishedAt)}</span>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4">
          {splitPolicyBlocks(policy.content).map((block, index) =>
            isSectionHeading(block) ? (
              <h2
                key={`${block}-${index}`}
                className="mt-3 text-xl font-semibold tracking-normal text-slate-950"
              >
                {block}
              </h2>
            ) : (
              <p key={`${block}-${index}`} className="whitespace-pre-line text-base leading-7">
                {block}
              </p>
            ),
          )}
        </div>
      </article>
    </main>
  );
}
