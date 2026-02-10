import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getBookmarkControllerFindAllQueryKey,
  useBookmarkControllerCreate,
} from '@/shared/api/generated/bookmark/bookmark';
import { bookmarkSchema } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

import type { BookmarkInput } from '@/shared/api/schemas';

interface ApiError {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

export const CreateBookmarkForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useBookmarkControllerCreate();

  const form = useForm<BookmarkInput>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: '',
      url: '',
    },
  });

  function onSubmit(values: BookmarkInput) {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success('Bookmark created');
          form.reset();
          queryClient.invalidateQueries({ queryKey: getBookmarkControllerFindAllQueryKey() });
        },
        onError: (error: unknown) => {
          const apiError = error as ApiError;
          toast.error(apiError.response?.data?.error?.message || 'Failed to create bookmark');
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="OpenCode docs" {...field} />
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
        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Saving...' : 'Add Bookmark'}
        </Button>
      </form>
    </Form>
  );
};
