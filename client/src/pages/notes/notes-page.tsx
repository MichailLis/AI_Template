import { CreateNoteForm } from '@/features/create-note/ui/create-note-form';
import { useNoteControllerFindAll } from '@/shared/api/generated/note/note';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function NotesPage() {
  const { data: notes, isLoading } = useNoteControllerFindAll();

  return (
    <div className="container mx-auto p-6 grid gap-8 md:grid-cols-[300px_1fr]">
      <aside>
        <div className="sticky top-20 space-y-4">
          <h2 className="text-xl font-bold">New Note</h2>
          <CreateNoteForm />
        </div>
      </aside>
      
      <main className="space-y-4">
        <h2 className="text-xl font-bold">My Notes</h2>
        {isLoading && <p>Loading notes...</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {notes?.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
