import { useQueryClient } from '@tanstack/react-query';

import { CreateTaskForm } from '@/features/create-task/ui/create-task-form';
import { useTaskControllerFindAll, useTaskControllerToggle, getTaskControllerFindAllQueryKey } from '@/shared/api/generated/task/task';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useTaskControllerFindAll();
  const toggleMutation = useTaskControllerToggle();

  const handleToggle = (id: number) => {
    toggleMutation.mutate({ id: id.toString() }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getTaskControllerFindAllQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Tasks</h1>
      
      <CreateTaskForm />
      
      <div className="space-y-2">
        {isLoading && <p>Loading tasks...</p>}
        {data?.map((task) => (
          <Card key={task.id} className={task.completed ? 'opacity-50' : ''}>
            <CardContent className="flex items-center justify-between p-4">
              <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
              <Button 
                variant={task.completed ? 'outline' : 'default'} 
                size="sm"
                onClick={() => handleToggle(task.id)}
              >
                {task.completed ? 'Done' : 'Complete'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
