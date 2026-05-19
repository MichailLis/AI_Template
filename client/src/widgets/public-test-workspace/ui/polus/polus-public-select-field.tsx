import { useEffect, useId, useMemo, useRef, useState } from 'react';

interface PolusSelectOption {
  value: string;
  label: string;
}

interface PolusSelectFieldProps {
  id: string;
  value: string;
  options: readonly PolusSelectOption[];
  placeholder: string;
  placement?: 'bottom' | 'top';
  required?: boolean;
  onChange: (value: string) => void;
}

export function PolusSelectField({
  id,
  value,
  options,
  placeholder,
  placement = 'bottom',
  required = false,
  onChange,
}: PolusSelectFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(selectedIndex, 0));
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const moveActiveOption = (direction: 1 | -1) => {
    setIsOpen(true);
    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) {
        return options.length - 1;
      }

      if (nextIndex >= options.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  return (
    <div
      className="polus-select-field"
      data-empty={!selectedOption}
      data-open={isOpen}
      data-placement={placement}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
      ref={rootRef}
    >
      <button
        aria-activedescendant={isOpen ? `${listboxId}-${options[activeIndex]?.value}` : undefined}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
        className="polus-select-trigger"
        id={id}
        onClick={() => (isOpen ? setIsOpen(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveActiveOption(1);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveActiveOption(-1);
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (isOpen) {
              selectOption(options[activeIndex]?.value ?? '');
            } else {
              openList();
            }
          } else if (event.key === 'Escape') {
            setIsOpen(false);
          } else if (event.key === 'Tab') {
            setIsOpen(false);
          }
        }}
        role="combobox"
        type="button"
      >
        <span>{selectedOption?.label ?? placeholder}</span>
      </button>

      {isOpen ? (
        <div aria-labelledby={id} className="polus-select-menu" id={listboxId} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className="polus-select-option"
              data-active={index === activeIndex}
              data-selected={option.value === value}
              id={`${listboxId}-${option.value}`}
              key={option.value}
              onClick={() => selectOption(option.value)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              tabIndex={-1}
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value ? <span className="polus-select-check" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
