import { useNotesControllerFindAll } from '@/shared/api/generated/notes/notes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const formatCreatedAt = (value: string) => {
  return new Date(value).toLocaleString();
};

export const NotesList = () => {
  const { data: notes } = useNotesControllerFindAll();

  if (notes?.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-lg border-dashed">
        No notes yet. Create one!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes?.map((note) => (
        <Card key={note.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="line-clamp-1">{note.title}</CardTitle>
            <CardDescription>{formatCreatedAt(note.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="whitespace-pre-wrap line-clamp-4 text-sm text-muted-foreground">
              {note.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
