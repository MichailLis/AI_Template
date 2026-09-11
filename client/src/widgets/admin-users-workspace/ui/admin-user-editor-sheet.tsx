import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { extractApiValidationIssues, parseApiError } from '@/shared/lib/api-error';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

import {
  adminUserFormSchema,
  getAdminUserFormValues,
  toAdminUserFormField,
  toCreateUserPayload,
  toUpdateUserPayload,
  translateServerFieldMessage,
  type AdminUserFormValues,
} from './admin-user-form.schema';

import type { AdminUser } from './admin-users-workspace.types';
import type { CreateUserDto, UpdateUserDto } from '@/shared/api/model';
import type { UseFormReturn } from 'react-hook-form';

interface CreateEditorSheetProps {
  mode: 'create';
  user?: never;
  onClose: () => void;
  onSubmit: (payload: CreateUserDto) => Promise<void>;
}

interface EditEditorSheetProps {
  mode: 'edit';
  user: AdminUser;
  onClose: () => void;
  onSubmit: (payload: UpdateUserDto) => Promise<void>;
}

type AdminUserEditorSheetProps = CreateEditorSheetProps | EditEditorSheetProps;

interface AdminUserFormFieldsProps {
  form: UseFormReturn<AdminUserFormValues>;
  mode: 'create' | 'edit';
  disabled: boolean;
}

// Роль и пароль задаются только при создании: для них есть отдельные действия в меню строки.
function AdminUserFormFields({ form, mode, disabled }: AdminUserFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl>
              <Input {...field} type="email" autoComplete="off" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Имя</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                placeholder="Необязательно"
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {mode === 'create' ? (
        <>
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Роль</FormLabel>
                <FormControl>
                  <AdminSelectField {...field} disabled={disabled}>
                    <option value="USER">Пользователь</option>
                    <option value="ADMIN">Администратор</option>
                  </AdminSelectField>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="new-password"
                    spellCheck={false}
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>
                  Оставьте пустым — система сгенерирует пароль и покажет его один раз.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
    </>
  );
}

const SUBMIT_LABELS = {
  create: 'Создать пользователя',
  edit: 'Сохранить изменения',
} as const;

/**
 * Монтируется заново на каждое открытие, поэтому начальные значения формы берутся один раз при
 * монтировании и не требуют синхронизации с данными списка.
 */
export function AdminUserEditorSheet(props: AdminUserEditorSheetProps) {
  const { mode, onClose } = props;
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserFormSchema),
    defaultValues: getAdminUserFormValues(props.user),
  });
  const { isDirty, isSubmitting } = form.formState;

  const requestClose = () => {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      setCloseConfirmationOpen(true);
      return;
    }

    onClose();
  };

  const applyServerValidationErrors = (error: unknown) => {
    const fieldIssues = extractApiValidationIssues(error).flatMap((issue) => {
      const field = toAdminUserFormField(issue.path);
      return field ? [{ field, message: translateServerFieldMessage(issue.message) }] : [];
    });

    for (const issue of fieldIssues) {
      form.setError(issue.field, { type: 'server', message: issue.message });
    }

    if (fieldIssues.length > 0) {
      form.setFocus(fieldIssues[0].field);
    }

    return fieldIssues.length > 0;
  };

  const submitForm = async (values: AdminUserFormValues) => {
    try {
      if (props.mode === 'create') {
        await props.onSubmit(toCreateUserPayload(values));
      } else {
        await props.onSubmit(toUpdateUserPayload(values));
      }

      onClose();
    } catch (error) {
      if (!applyServerValidationErrors(error)) {
        toast.error(parseApiError(error));
      }
    }
  };

  return (
    <>
      <Sheet open onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <SheetContent
          className="admin-surface"
          closeDisabled={isSubmitting}
          onEscapeKeyDown={(event) => {
            if (isSubmitting) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (isSubmitting) {
              event.preventDefault();
            }
          }}
        >
          <Form {...form}>
            <form
              className="flex min-h-0 flex-1 flex-col"
              noValidate
              onSubmit={form.handleSubmit(submitForm)}
            >
              <SheetHeader>
                <SheetTitle>
                  {mode === 'create' ? 'Новый пользователь' : 'Данные пользователя'}
                </SheetTitle>
                <SheetDescription>
                  {mode === 'create'
                    ? 'Регистрации нет: аккаунт появляется, только когда его создаёт администратор.'
                    : `Измените email или имя пользователя ${props.user?.email ?? ''}.`}
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="flex flex-col gap-4">
                <AdminUserFormFields form={form} mode={mode} disabled={isSubmitting} />
              </SheetBody>

              <SheetFooter className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={requestClose}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? 'Сохраняем...' : SUBMIT_LABELS[mode]}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={closeConfirmationOpen}
        title="Закрыть без сохранения?"
        description="Внесённые изменения будут потеряны."
        confirmLabel="Закрыть"
        cancelLabel="Остаться"
        onConfirm={() => {
          setCloseConfirmationOpen(false);
          onClose();
        }}
        onClose={() => setCloseConfirmationOpen(false)}
      />
    </>
  );
}
