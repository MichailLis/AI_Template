import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getNewsControllerFindAllQueryKey,
  useNewsControllerCreate,
} from '@/shared/api/generated/news/news';
import { newsSchema } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

import type { NewsInput } from '@/shared/api/schemas';

interface ApiError {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

export const CreateNewsForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useNewsControllerCreate();

  const form = useForm<NewsInput>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const currentTitle = useWatch({
    control: form.control,
    name: 'title',
  });
  const currentContent = useWatch({
    control: form.control,
    name: 'content',
  });

  function onSubmit(values: NewsInput) {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success('News added');
          form.reset();
          queryClient.invalidateQueries({ queryKey: getNewsControllerFindAllQueryKey() });
        },
        onError: (error: unknown) => {
          const apiError = error as ApiError;
          toast.error(apiError.response?.data?.error?.message || 'Failed to add news');
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Release update" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>News editor</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write the news content here..."
                    className="min-h-[180px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Publishing...' : 'Publish News'}
          </Button>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{currentTitle || 'News title preview'}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {currentContent || 'News content preview'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
