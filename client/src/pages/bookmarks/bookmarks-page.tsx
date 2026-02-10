import { CreateBookmarkForm } from '@/features/create-bookmark/ui/create-bookmark-form';
import { useBookmarkControllerFindAll } from '@/shared/api/generated/bookmark/bookmark';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function BookmarksPage() {
  const { data: bookmarks, isLoading } = useBookmarkControllerFindAll();

  return (
    <div className="container mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-[360px_1fr]">
      <aside>
        <div className="sticky top-20 space-y-4">
          <h2 className="text-xl font-bold">New Bookmark</h2>
          <CreateBookmarkForm />
        </div>
      </aside>

      <main className="space-y-4">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        {isLoading && <p>Loading bookmarks...</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarks?.map((bookmark) => (
            <Card key={bookmark.id}>
              <CardHeader>
                <CardTitle className="text-base">{bookmark.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-blue-600 underline"
                >
                  {bookmark.url}
                </a>
              </CardContent>
            </Card>
          ))}
          {bookmarks?.length === 0 && (
            <p className="text-sm text-muted-foreground">No bookmarks yet. Add your first one.</p>
          )}
        </div>
      </main>
    </div>
  );
}
