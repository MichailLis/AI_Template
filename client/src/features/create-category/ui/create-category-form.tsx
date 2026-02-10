import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCategoryControllerCreate, getCategoryControllerFindAllQueryKey } from '@/shared/api/generated/category/category';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

const createCategorySchema = z.object({
  name: z.string().min(2, 'Name is too short'),
});

type CreateCategoryInput = z.infer<typeof createCategorySchema>;

interface ApiError {
  response?: {
    data?: {
      error?: {
        message: string;
      };
    };
  };
}

export const CreateCategoryForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useCategoryControllerCreate();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: CreateCategoryInput) {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success('Category created!');
        form.reset();
        queryClient.invalidateQueries({ queryKey: getCategoryControllerFindAllQueryKey() });
      },
      onError: (error: unknown) => {
        const apiError = error as ApiError;
        toast.error(apiError.response?.data?.error?.message || 'Failed to create category');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1 space-y-0">
              <FormControl><Input placeholder="Category name" {...field} /></FormControl>
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