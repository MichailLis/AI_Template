import { useState } from 'react';

import type { PrivacyPolicySettings } from './admin-settings-cards.model';

export const EMPTY_PRIVACY_POLICY_FORM = {
  content: '',
  isDirty: false,
  isPublishedAtManual: false,
  operatorFullName: '',
  publishedAt: '',
  version: '',
};

export const toDateTimeLocalValue = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => part.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const getNowDateTimeLocalValue = () => toDateTimeLocalValue(new Date().toISOString());

export const toIsoFromDateTimeLocal = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

export function usePrivacyPolicyFormState(privacyPolicy: PrivacyPolicySettings | undefined) {
  const [privacyPolicyForm, setPrivacyPolicyForm] = useState(EMPTY_PRIVACY_POLICY_FORM);

  const privacyPolicyVersion = privacyPolicyForm.isDirty
    ? privacyPolicyForm.version
    : (privacyPolicy?.version ?? '');
  const privacyPolicyPublishedAt = privacyPolicyForm.isDirty
    ? privacyPolicyForm.publishedAt
    : toDateTimeLocalValue(privacyPolicy?.publishedAt);
  const privacyPolicyContent = privacyPolicyForm.isDirty
    ? privacyPolicyForm.content
    : (privacyPolicy?.content ?? '');
  const privacyPolicyOperatorFullName = privacyPolicyForm.isDirty
    ? privacyPolicyForm.operatorFullName
    : (privacyPolicy?.operatorFullName ?? '');

  const normalizedPrivacyPolicyVersion = privacyPolicyVersion.trim();
  const normalizedPrivacyPolicyContent = privacyPolicyContent.trim();
  const normalizedPrivacyPolicyOperatorFullName = privacyPolicyOperatorFullName.trim();
  const privacyPolicyPublishedAtIso = toIsoFromDateTimeLocal(privacyPolicyPublishedAt);

  const getPrivacyPolicyDraft = (current: typeof privacyPolicyForm) => ({
    content: current.isDirty ? current.content : (privacyPolicy?.content ?? ''),
    operatorFullName: current.isDirty
      ? current.operatorFullName
      : (privacyPolicy?.operatorFullName ?? ''),
    publishedAt: current.isDirty
      ? current.publishedAt
      : toDateTimeLocalValue(privacyPolicy?.publishedAt),
    version: current.isDirty ? current.version : (privacyPolicy?.version ?? ''),
  });

  const handleVersionChange = (value: string) => {
    setPrivacyPolicyForm((current) => {
      const draft = getPrivacyPolicyDraft(current);
      const isVersionChanged = value.trim() !== (privacyPolicy?.version ?? '').trim();
      const isContentChanged = draft.content.trim() !== (privacyPolicy?.content ?? '').trim();
      const shouldAutoUpdateDate =
        (isVersionChanged || isContentChanged) && !current.isPublishedAtManual;

      return {
        ...draft,
        isDirty: true,
        isPublishedAtManual: current.isPublishedAtManual,
        publishedAt: shouldAutoUpdateDate ? getNowDateTimeLocalValue() : draft.publishedAt,
        version: value,
      };
    });
  };

  const handleContentChange = (value: string) => {
    setPrivacyPolicyForm((current) => {
      const draft = getPrivacyPolicyDraft(current);
      const isContentChanged = value.trim() !== (privacyPolicy?.content ?? '').trim();
      const isVersionChanged = draft.version.trim() !== (privacyPolicy?.version ?? '').trim();
      const shouldAutoUpdateDate =
        (isContentChanged || isVersionChanged) && !current.isPublishedAtManual;

      return {
        ...draft,
        isDirty: true,
        isPublishedAtManual: current.isPublishedAtManual,
        publishedAt: shouldAutoUpdateDate ? getNowDateTimeLocalValue() : draft.publishedAt,
        content: value,
      };
    });
  };

  const handlePublishedAtChange = (value: string) => {
    setPrivacyPolicyForm((current) => ({
      ...getPrivacyPolicyDraft(current),
      isDirty: true,
      isPublishedAtManual: true,
      publishedAt: value,
    }));
  };

  const handleOperatorFullNameChange = (value: string) => {
    setPrivacyPolicyForm((current) => ({
      ...getPrivacyPolicyDraft(current),
      isDirty: true,
      isPublishedAtManual: current.isPublishedAtManual,
      operatorFullName: value,
    }));
  };

  const handleSetCurrentDate = () => {
    setPrivacyPolicyForm((current) => ({
      ...getPrivacyPolicyDraft(current),
      isDirty: true,
      isPublishedAtManual: true,
      publishedAt: getNowDateTimeLocalValue(),
    }));
  };

  const resetForm = () => setPrivacyPolicyForm(EMPTY_PRIVACY_POLICY_FORM);

  const isOldDateWithNewContent = Boolean(
    privacyPolicy?.publishedAt &&
    (normalizedPrivacyPolicyVersion !== (privacyPolicy.version ?? '').trim() ||
      normalizedPrivacyPolicyContent !== (privacyPolicy.content ?? '').trim()) &&
    privacyPolicyPublishedAtIso &&
    new Date(privacyPolicyPublishedAtIso).getTime() <=
      new Date(privacyPolicy.publishedAt).getTime(),
  );

  return {
    content: privacyPolicyContent,
    isOldDateWithNewContent,
    normalizedContent: normalizedPrivacyPolicyContent,
    normalizedOperatorFullName: normalizedPrivacyPolicyOperatorFullName,
    normalizedVersion: normalizedPrivacyPolicyVersion,
    onContentChange: handleContentChange,
    onOperatorFullNameChange: handleOperatorFullNameChange,
    onPublishedAtChange: handlePublishedAtChange,
    onSetCurrentDate: handleSetCurrentDate,
    onVersionChange: handleVersionChange,
    operatorFullName: privacyPolicyOperatorFullName,
    publishedAt: privacyPolicyPublishedAt,
    publishedAtIso: privacyPolicyPublishedAtIso,
    resetForm,
    version: privacyPolicyVersion,
  };
}
