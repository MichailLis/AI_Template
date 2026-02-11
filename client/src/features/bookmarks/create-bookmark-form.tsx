import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useBookmarksControllerCreate } from '@/shared/api/generated/bookmarks/bookmarks';
import { bookmarkSchema, type BookmarkInput } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

export const CreateBookmarkForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { mutate, isPending } = useBookmarksControllerCreate();

  const form = useForm<BookmarkInput>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: '',
      url: '',
    },
  });

  const onSubmit = (data: BookmarkInput) => {
    mutate(
      { data },
      {
        onSuccess: () => {
          toast.success('Bookmark created');
          form.reset();
          onSuccess?.();
        },
        onError: () => {
          toast.error('Failed to create bookmark');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Bookmark</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Bookmark title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Bookmark'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
