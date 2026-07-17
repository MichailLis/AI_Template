import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { extractApiValidationIssues, parseApiError } from '@/shared/lib/api-error';
import { Button } from '@/shared/ui/button';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';
import { Form } from '@/shared/ui/form';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

import { EducationOrganizationForm } from './education-organization-form';
import {
  createEducationOrganizationFormValues,
  educationOrganizationFormSchema,
  mapEducationOrganizationToFormValues,
  toCreateEducationOrganizationPayload,
  toUpdateEducationOrganizationPayload,
  type EducationOrganizationFormValues,
  type OrganizationEditorMode,
} from './education-organization-form.schema';

import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListResponseDtoOrganizationsItem,
  AdminUpdateEducationOrganizationDto,
} from '@/shared/api/model';
import type { FieldPath } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

interface EditorSheetCommonProps {
  open: boolean;
  onClose: () => void;
}

interface CreateEditorSheetProps extends EditorSheetCommonProps {
  mode: 'create';
  organization?: never;
  onSubmit: (payload: AdminCreateEducationOrganizationDto) => Promise<void>;
}

interface EditEditorSheetProps extends EditorSheetCommonProps {
  mode: 'edit';
  organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem;
  onSubmit: (payload: AdminUpdateEducationOrganizationDto) => Promise<void>;
}

type EducationOrganizationEditorSheetProps = CreateEditorSheetProps | EditEditorSheetProps;

const FORM_FIELD_NAMES = new Set<FieldPath<EducationOrganizationFormValues>>([
  'name',
  'isActive',
  'fullName',
  'shortName',
  'inn',
  'ogrn',
  'legalAddress',
  'email',
  'phone',
  'privacyPolicyUrl',
  'consentDocumentUrl',
  'logoUrl',
  'groupValidationMode',
  'groupValidationPattern',
  'groupValidationExample',
  'groupValidationHint',
]);

const toFormFieldName = (path: string): FieldPath<EducationOrganizationFormValues> | null => {
  const fieldName = path.split('.').at(-1) as FieldPath<EducationOrganizationFormValues>;
  return FORM_FIELD_NAMES.has(fieldName) ? fieldName : null;
};

const getInitialValues = (
  mode: OrganizationEditorMode,
  organization?: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
) =>
  mode === 'edit' && organization
    ? mapEducationOrganizationToFormValues(organization)
    : createEducationOrganizationFormValues();

interface EditorSheetFormProps {
  form: UseFormReturn<EducationOrganizationFormValues>;
  mode: OrganizationEditorMode;
  organizationName?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: EducationOrganizationFormValues) => Promise<void>;
}

function EditorSheetForm({
  form,
  mode,
  organizationName,
  isSubmitting,
  onCancel,
  onSubmit,
}: EditorSheetFormProps) {
  const title = mode === 'create' ? 'Новое учебное заведение' : 'Редактирование заведения';
  const submitLabel = mode === 'create' ? 'Создать заведение' : 'Сохранить изменения';
  const pendingLabel = mode === 'create' ? 'Создаём...' : 'Сохраняем...';

  return (
    <Form {...form}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Для создания достаточно названия. Остальные данные можно заполнить позже.'
              : `Измените данные организации «${organizationName ?? ''}».`}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <EducationOrganizationForm form={form} mode={mode} disabled={isSubmitting} />
        </SheetBody>

        <SheetFooter className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? pendingLabel : submitLabel}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
}

export function EducationOrganizationEditorSheet(props: EducationOrganizationEditorSheetProps) {
  const { mode, open, onClose } = props;
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const initialValues = useMemo(
    () => getInitialValues(mode, props.organization),
    [mode, props.organization],
  );
  const form = useForm<EducationOrganizationFormValues>({
    resolver: zodResolver(educationOrganizationFormSchema),
    defaultValues: initialValues,
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

  const closeWithoutSaving = () => {
    if (isSubmitting) {
      return;
    }

    setCloseConfirmationOpen(false);
    form.reset(initialValues);
    onClose();
  };

  const applyServerValidationErrors = (error: unknown) => {
    const issues = extractApiValidationIssues(error);
    const fieldIssues = issues
      .map((issue) => ({ ...issue, field: toFormFieldName(issue.path) }))
      .filter(
        (issue): issue is typeof issue & { field: FieldPath<EducationOrganizationFormValues> } =>
          issue.field !== null,
      );

    if (fieldIssues.length === 0) {
      return false;
    }

    for (const issue of fieldIssues) {
      form.setError(issue.field, { type: 'server', message: issue.message });
    }
    form.setFocus(fieldIssues[0].field);
    return true;
  };

  const submitForm = async (values: EducationOrganizationFormValues) => {
    try {
      if (props.mode === 'create') {
        await props.onSubmit(toCreateEducationOrganizationPayload(values));
      } else {
        await props.onSubmit(toUpdateEducationOrganizationPayload(values));
      }

      form.reset(values);
      onClose();
    } catch (error) {
      if (!applyServerValidationErrors(error)) {
        toast.error(parseApiError(error));
      }
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            requestClose();
          }
        }}
      >
        <SheetContent
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
          <EditorSheetForm
            form={form}
            mode={mode}
            organizationName={props.organization?.name}
            isSubmitting={isSubmitting}
            onCancel={requestClose}
            onSubmit={submitForm}
          />
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={closeConfirmationOpen}
        title="Закрыть без сохранения?"
        description="Внесённые изменения будут потеряны."
        confirmLabel="Закрыть"
        cancelLabel="Остаться"
        onConfirm={closeWithoutSaving}
        onClose={() => setCloseConfirmationOpen(false)}
      />
    </>
  );
}
