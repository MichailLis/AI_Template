import { useProjectControllerFindAll } from '@/shared/api/generated/project/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const ProjectList = () => {
  const { data: projects, isLoading } = useProjectControllerFindAll();

  if (isLoading) return <div>Loading projects...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects?.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.description || 'No description'}</p>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      ))}
      {projects?.length === 0 && (
        <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg text-slate-400">
          No projects found. Create your first one!
        </div>
      )}
    </div>
  );
};