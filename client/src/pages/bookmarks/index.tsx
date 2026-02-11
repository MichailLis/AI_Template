import { useQueryClient } from '@tanstack/react-query';

import { BookmarksList } from '@/features/bookmarks/bookmarks-list';
import { CreateBookmarkForm } from '@/features/bookmarks/create-bookmark-form';
import { getBookmarksControllerFindAllQueryKey } from '@/shared/api/generated/bookmarks/bookmarks';

const BookmarksPage = () => {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: getBookmarksControllerFindAllQueryKey(),
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <aside>
          <CreateBookmarkForm onSuccess={handleSuccess} />
        </aside>
        <main>
          <BookmarksList />
        </main>
      </div>
    </div>
  );
};

export default BookmarksPage;
