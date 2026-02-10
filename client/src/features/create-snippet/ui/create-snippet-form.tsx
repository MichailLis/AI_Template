import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getSnippetControllerFindAllQueryKey,
  useSnippetControllerCreate,
} from '@/shared/api/generated/snippet/snippet';
import { snippetSchema } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

import type { SnippetInput } from '@/shared/api/schemas';

interface ApiError {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

export const CreateSnippetForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useSnippetControllerCreate();

  const form = useForm<SnippetInput>({
    resolver: zodResolver(snippetSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  function onSubmit(values: SnippetInput) {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success('Snippet created');
          form.reset();
          queryClient.invalidateQueries({ queryKey: getSnippetControllerFindAllQueryKey() });
        },
        onError: (error: unknown) => {
          const apiError = error as ApiError;
          toast.error(apiError.response?.data?.error?.message || 'Failed to create snippet');
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
                <Input placeholder="Useful command" {...field} />
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
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Input placeholder="npm run lint" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Saving...' : 'Add Snippet'}
        </Button>
      </form>
    </Form>
  );
};
