import { CreateSnippetForm } from '@/features/create-snippet/ui/create-snippet-form';
import { useSnippetControllerFindAll } from '@/shared/api/generated/snippet/snippet';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function SnippetsPage() {
  const { data: snippets, isLoading } = useSnippetControllerFindAll();

  return (
    <div className="container mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-[360px_1fr]">
      <aside>
        <div className="sticky top-20 space-y-4">
          <h2 className="text-xl font-bold">New Snippet</h2>
          <CreateSnippetForm />
        </div>
      </aside>

      <main className="space-y-4">
        <h1 className="text-2xl font-bold">Snippets</h1>
        {isLoading && <p>Loading snippets...</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {snippets?.map((snippet) => (
            <Card key={snippet.id}>
              <CardHeader>
                <CardTitle className="text-base">{snippet.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {snippet.content}
                </p>
              </CardContent>
            </Card>
          ))}
          {snippets?.length === 0 && (
            <p className="text-sm text-muted-foreground">No snippets yet. Add your first one.</p>
          )}
        </div>
      </main>
    </div>
  );
}
