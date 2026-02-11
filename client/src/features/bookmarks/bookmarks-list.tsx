import { useBookmarksControllerFindAll } from '@/shared/api/generated/bookmarks/bookmarks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const BookmarksList = () => {
  const { data: bookmarks } = useBookmarksControllerFindAll();

  if (bookmarks?.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-lg border-dashed">
        No bookmarks yet. Create one!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks?.map((bookmark) => (
        <Card key={bookmark.id}>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{bookmark.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline break-all"
            >
              {bookmark.url}
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
