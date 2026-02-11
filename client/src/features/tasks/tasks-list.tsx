import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTasksControllerFindAllQueryKey,
  useTasksControllerFindAll,
  useTasksControllerUpdateStatus,
} from '@/shared/api/generated/tasks/tasks';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const TasksList = () => {
  const queryClient = useQueryClient();
  const { data: tasks } = useTasksControllerFindAll();
  const { mutate: updateStatus, isPending } = useTasksControllerUpdateStatus();

  const handleToggle = (id: number, done: boolean) => {
    updateStatus(
      { id: String(id), data: { done: !done } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getTasksControllerFindAllQueryKey(),
          });
        },
        onError: () => {
          toast.error('Failed to update task');
        },
      },
    );
  };

  if (tasks?.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-lg border-dashed">
        No tasks yet. Create one!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks?.map((task) => (
        <Card key={task.id}>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center justify-between gap-4">
              <span className={task.done ? 'line-through text-muted-foreground' : ''}>
                {task.title}
              </span>
              <Button
                variant={task.done ? 'outline' : 'default'}
                size="sm"
                disabled={isPending}
                onClick={() => handleToggle(task.id, task.done)}
              >
                {task.done ? 'Mark as active' : 'Mark as done'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 text-xs text-muted-foreground">
            Created: {new Date(task.createdAt).toLocaleString()}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
