import { useQueryClient } from '@tanstack/react-query';

import { CreateNoteForm } from '@/features/notes/create-note-form';
import { NotesList } from '@/features/notes/notes-list';
import { getNotesControllerFindAllQueryKey } from '@/shared/api/generated/notes/notes';

const NotesPage = () => {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getNotesControllerFindAllQueryKey() });
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
        <aside>
          <CreateNoteForm onSuccess={handleSuccess} />
        </aside>
        <main>
          <NotesList />
        </main>
      </div>
    </div>
  );
};

export default NotesPage;
