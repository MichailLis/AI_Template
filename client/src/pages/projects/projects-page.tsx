import { CreateProjectForm } from '@/features/create-project';
import { ProjectList } from '@/widgets/project-list';

export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
        <p className="text-muted-foreground">Manage and track your fullstack projects.</p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-[1fr_350px] items-start">
        <section className="order-2 lg:order-1">
          <ProjectList />
        </section>
        
        <aside className="order-1 lg:order-2">
          <CreateProjectForm />
        </aside>
      </div>
    </div>
  );
}
