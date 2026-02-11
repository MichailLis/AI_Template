import { useQueryClient } from '@tanstack/react-query';

import { CreateTaskForm } from '@/features/tasks/create-task-form';
import { TasksList } from '@/features/tasks/tasks-list';
import { getTasksControllerFindAllQueryKey } from '@/shared/api/generated/tasks/tasks';

const TasksPage = () => {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getTasksControllerFindAllQueryKey() });
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <aside>
          <CreateTaskForm onSuccess={handleSuccess} />
        </aside>
        <main>
          <TasksList />
        </main>
      </div>
    </div>
  );
};

export default TasksPage;
