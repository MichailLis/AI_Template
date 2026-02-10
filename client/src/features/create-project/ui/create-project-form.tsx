import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { toast } from 'sonner';
import { useProjectControllerCreate } from '@/shared/api/generated/project/project';
import { useQueryClient } from '@tanstack/react-query';
import { getProjectControllerFindAllQueryKey } from '@/shared/api/generated/project/project';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().optional(),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

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
        // Инвалидируем кэш списка проектов
        queryClient.invalidateQueries({ queryKey: getProjectControllerFindAllQueryKey() });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Failed to create project');
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
