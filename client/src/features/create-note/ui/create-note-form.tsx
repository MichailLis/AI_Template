import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { toast } from 'sonner';
import { useNoteControllerCreate, getNoteControllerFindAllQueryKey } from '@/shared/api/generated/note/note';
import { useQueryClient } from '@tanstack/react-query';

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const CreateNoteForm = () => {
  const queryClient = useQueryClient();
  const createMutation = useNoteControllerCreate();

  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { title: '', content: '' },
  });

  async function onSubmit(values: CreateNoteInput) {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success('Note created!');
        form.reset();
        queryClient.invalidateQueries({ queryKey: getNoteControllerFindAllQueryKey() });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error?.message || 'Failed to create note');
      }
    });
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
              <FormControl><Input placeholder="Note title" {...field} /></FormControl>
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
              <FormControl><Input placeholder="Note content" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Saving...' : 'Add Note'}
        </Button>
      </form>
    </Form>
  );
};
