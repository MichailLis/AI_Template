import { CreateNewsForm } from '@/features/create-news/ui/create-news-form';
import { useNewsControllerFindAll } from '@/shared/api/generated/news/news';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function NewsPage() {
  const { data: news, isLoading } = useNewsControllerFindAll();

  return (
    <div className="container mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-[420px_1fr]">
      <aside>
        <div className="sticky top-20 space-y-4">
          <h2 className="text-xl font-bold">Create News</h2>
          <CreateNewsForm />
        </div>
      </aside>

      <main className="space-y-4">
        <h1 className="text-2xl font-bold">News Feed</h1>
        {isLoading && <p>Loading news...</p>}
        <div className="space-y-4">
          {news?.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.content}</p>
              </CardContent>
            </Card>
          ))}
          {news?.length === 0 && (
            <p className="text-sm text-muted-foreground">No news yet. Publish your first update.</p>
          )}
        </div>
      </main>
    </div>
  );
}
