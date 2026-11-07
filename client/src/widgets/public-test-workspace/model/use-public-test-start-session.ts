import { useTestsPublicControllerStartSession } from '@/shared/api/generated/tests-public/tests-public';

export function usePublicTestStartSession() {
  const mutation = useTestsPublicControllerStartSession();

  return { startSession: mutation.mutateAsync, isStarting: mutation.isPending };
}
