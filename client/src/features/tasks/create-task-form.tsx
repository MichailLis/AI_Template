import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useTasksControllerCreate } from '@/shared/api/generated/tasks/tasks';
import { createTaskSchema, type CreateTaskInput } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

export const CreateTaskForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { mutate, isPending } = useTasksControllerCreate();

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = (data: CreateTaskInput) => {
    mutate(
      { data },
      {
        onSuccess: () => {
          toast.success('Task created');
          form.reset();
          onSuccess?.();
        },
        onError: () => {
          toast.error('Failed to create task');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Task</CardTitle>
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
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
