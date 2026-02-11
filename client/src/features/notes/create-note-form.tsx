import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useNotesControllerCreate } from '@/shared/api/generated/notes/notes';
import { createNoteSchema, type CreateNoteInput } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export const CreateNoteForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { mutate, isPending } = useNotesControllerCreate();

  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = (data: CreateNoteInput) => {
    mutate(
      { data },
      {
        onSuccess: () => {
          toast.success('Note created');
          form.reset();
          onSuccess?.();
        },
        onError: () => {
          toast.error('Failed to create note');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Note</CardTitle>
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
                    <Input placeholder="Note title" {...field} />
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
                    <Textarea placeholder="Note content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Note'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
