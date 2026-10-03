import * as React from 'react';

interface AutoFocusHandlers {
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

/** Кнопка открытого меню Radix, внутри которого лежит элемент: ее `aria-controls` указывает на меню. */
const findMenuTrigger = (element: HTMLElement) => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (node.id) {
      const trigger = document.querySelector(`[aria-controls="${CSS.escape(node.id)}"]`);
      if (trigger instanceof HTMLElement) {
        return trigger;
      }
    }
  }
  return null;
};

/**
 * Последний элемент, получивший фокус, и кнопка меню, внутри которого он был. Меню часто снимается
 * раньше, чем окно успевает запомнить открывший его пункт: к этому моменту фокус уже на body, а
 * `aria-controls` с закрытого триггера Radix убирает. Поэтому связь запоминается, пока меню открыто.
 */
let lastFocused: { element: HTMLElement; menuTrigger: HTMLElement | null } | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (event) => {
      if (event.target instanceof HTMLElement) {
        lastFocused = { element: event.target, menuTrigger: findMenuTrigger(event.target) };
      }
    },
    true,
  );
}

/**
 * Возвращает фокус на элемент, который был активен при открытии модального окна.
 *
 * Radix возвращает фокус только на свой `*Trigger`. В админке окна открываются из состояния, без
 * Trigger, поэтому после закрытия фокус падал на `body`, и следующий Tab начинал обход страницы
 * сначала (WCAG 2.4.3).
 *
 * Окно часто открывается пунктом всплывающего меню «…», а меню к закрытию окна уже снято. Тогда
 * фокус возвращается на кнопку, открывшую меню. Если пропали оба элемента, остаётся поведение Radix.
 */
export function useRestoreFocus({
  onOpenAutoFocus,
  onCloseAutoFocus,
}: AutoFocusHandlers): Required<AutoFocusHandlers> {
  const opener = React.useRef<HTMLElement | null>(null);
  const fallback = React.useRef<HTMLElement | null>(null);

  const handleOpen = React.useCallback(
    (event: Event) => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) {
        opener.current = active;
        fallback.current = lastFocused?.element === active ? lastFocused.menuTrigger : null;
      } else {
        opener.current = lastFocused?.element ?? null;
        fallback.current = lastFocused?.menuTrigger ?? null;
      }
      onOpenAutoFocus?.(event);
    },
    [onOpenAutoFocus],
  );

  const handleClose = React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event);
      const target = [opener.current, fallback.current].find((element) => element?.isConnected);
      opener.current = null;
      fallback.current = null;
      if (event.defaultPrevented || !target) {
        return;
      }
      event.preventDefault();
      target.focus();
    },
    [onCloseAutoFocus],
  );

  return { onOpenAutoFocus: handleOpen, onCloseAutoFocus: handleClose };
}
