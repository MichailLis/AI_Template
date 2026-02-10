import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useProjectControllerCreate, getProjectControllerFindAllQueryKey } from '@/shared/api/generated/project/project';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().optional(),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

interface ApiError {
  response?: {
    data?: {
      error?: {
        message: string;
      };
    };
  };
}

export const CreateProjectForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useProjectControllerCreate();

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { title: '', description: '' },
  });

  async function onSubmit(values: CreateProjectInput) {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success('Project created!');
        form.reset();
        queryClient.invalidateQueries({ queryKey: getProjectControllerFindAllQueryKey() });
      },
      onError: (error: unknown) => {
        const apiError = error as ApiError;
        toast.error(apiError.response?.data?.error?.message || 'Failed to create project');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
        <h3 className="font-semibold text-lg">New Project</h3>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input placeholder="Awesome App" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Input placeholder="A small description" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  );
};