import { useAuthControllerSignin } from '@/shared/api/generated/auth/auth';

import type { LoginInput } from '@/shared/api/schemas';

type LoginMutation = ReturnType<typeof useAuthControllerSignin>;

export function useLogin() {
  const mutation = useAuthControllerSignin();

  const login = (values: LoginInput, options: Parameters<LoginMutation['mutate']>[1]) =>
    mutation.mutate({ data: values }, options);

  return { login, isPending: mutation.isPending };
}
