import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useTaskControllerCreate, getTaskControllerFindAllQueryKey } from '@/shared/api/generated/task/task';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

type CreateTaskInput = z.infer<typeof createTaskSchema>;

interface ApiError {
  response?: {
    data?: {
      error?: {
        message: string;
      };
    };
  };
}

export const CreateTaskForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useTaskControllerCreate();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '' },
  });

  async function onSubmit(values: CreateTaskInput) {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success('Task added');
        form.reset();
        queryClient.invalidateQueries({ queryKey: getTaskControllerFindAllQueryKey() });
      },
      onError: (error: unknown) => {
        const apiError = error as ApiError;
        toast.error(apiError.response?.data?.error?.message || 'Failed to add task');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 w-full">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-1 space-y-0">
              <FormControl><Input placeholder="What needs to be done?" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '...' : 'Add'}
        </Button>
      </form>
    </Form>
  );
};