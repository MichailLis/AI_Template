import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseAdminTestsWorkspaceNavigationParams {
  effectiveSelectedTopicId: number | null;
  isDraftDirty: boolean;
  pendingNavigationPath: string | null;
  discardCurrentDraftEditsAndResetAutosave: () => void;
  handleAttemptNavigation: (targetPath: string) => boolean;
  setIsNavigationConfirmOpen: (value: boolean) => void;
  setPendingNavigationPath: (value: string | null) => void;
}

export function useAdminTestsWorkspaceNavigation({
  effectiveSelectedTopicId,
  isDraftDirty,
  pendingNavigationPath,
  discardCurrentDraftEditsAndResetAutosave,
  handleAttemptNavigation,
  setIsNavigationConfirmOpen,
  setPendingNavigationPath,
}: UseAdminTestsWorkspaceNavigationParams) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPathRef = useRef(location.pathname + location.search + location.hash);

  const isListRoute = location.pathname === '/admin/tests';
  const isSettingsRoute =
    effectiveSelectedTopicId !== null && location.pathname.endsWith('/settings');

  useEffect(() => {
    currentPathRef.current = location.pathname + location.search + location.hash;
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    const handleBrowserPopState = () => {
      const nextPath = window.location.pathname + window.location.search + window.location.hash;
      const currentPath = currentPathRef.current;

      if (!isDraftDirty || nextPath === currentPath) {
        currentPathRef.current = nextPath;
        return;
      }

      window.history.pushState(window.history.state, '', currentPath);
      setPendingNavigationPath(nextPath);
      setIsNavigationConfirmOpen(true);
    };

    window.addEventListener('popstate', handleBrowserPopState);

    return () => {
      window.removeEventListener('popstate', handleBrowserPopState);
    };
  }, [isDraftDirty, setIsNavigationConfirmOpen, setPendingNavigationPath]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDraftDirty || event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== '_self') {
        return;
      }

      if (anchor.hasAttribute('download')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) {
        return;
      }

      const targetPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      if (targetPath === currentPathRef.current) {
        return;
      }

      event.preventDefault();
      handleAttemptNavigation(targetPath);
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [handleAttemptNavigation, isDraftDirty]);

  const handleNavigationLeave = useCallback(() => {
    discardCurrentDraftEditsAndResetAutosave();
    setIsNavigationConfirmOpen(false);

    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
    }

    setPendingNavigationPath(null);
  }, [
    discardCurrentDraftEditsAndResetAutosave,
    navigate,
    pendingNavigationPath,
    setIsNavigationConfirmOpen,
    setPendingNavigationPath,
  ]);

  const handleNavigationStay = useCallback(() => {
    setIsNavigationConfirmOpen(false);
    setPendingNavigationPath(null);
  }, [setIsNavigationConfirmOpen, setPendingNavigationPath]);

  const handleWorkspaceNavigate = useCallback(
    (targetPath: string) => {
      if (!handleAttemptNavigation(targetPath)) {
        return;
      }

      navigate(targetPath);
    },
    [handleAttemptNavigation, navigate],
  );

  return {
    isListRoute,
    isSettingsRoute,
    handleNavigationLeave,
    handleNavigationStay,
    handleWorkspaceNavigate,
  };
}
