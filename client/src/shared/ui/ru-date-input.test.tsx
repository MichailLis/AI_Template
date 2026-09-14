import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RuDateInput } from './ru-date-input';

/**
 * Обёртка с настоящим состоянием: так поле проверяется в том же режиме, в каком его использует
 * фильтр аналитики, — родитель хранит только ISO-дату, а черновик ввода живёт внутри поля.
 */
function ControlledDateInput({
  initialValue = '',
  onChange,
}: {
  initialValue?: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <RuDateInput
      aria-label="Дата с"
      value={value}
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange(nextValue);
      }}
    />
  );
}

describe('RuDateInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the stored ISO date in the Russian day-first order', () => {
    render(<ControlledDateInput initialValue="2026-09-06" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Дата с')).toHaveValue('06.09.2026');
  });

  it('prompts for the Russian format regardless of the browser language', () => {
    render(<ControlledDateInput onChange={vi.fn()} />);

    expect(screen.getByLabelText('Дата с')).toHaveAttribute('placeholder', 'ДД.ММ.ГГГГ');
  });

  it('reports nothing until the date is complete, then reports the ISO date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDateInput onChange={onChange} />);

    const input = screen.getByLabelText('Дата с');
    await user.type(input, '0609');

    expect(input).toHaveValue('06.09');
    expect(onChange).not.toHaveBeenCalled();

    await user.type(input, '2026');

    expect(input).toHaveValue('06.09.2026');
    expect(onChange).toHaveBeenLastCalledWith('2026-09-06');
  });

  it('reports an empty value when the field is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDateInput initialValue="2026-09-06" onChange={onChange} />);

    await user.clear(screen.getByLabelText('Дата с'));

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByLabelText('Дата с')).toHaveValue('');
  });

  it('marks a complete date that does not exist as invalid and does not report it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDateInput onChange={onChange} />);

    const input = screen.getByLabelText('Дата с');
    await user.type(input, '31022026');

    expect(input).toHaveValue('31.02.2026');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });
});

function ControlledDateTimeInput({
  initialValue = '',
  onChange,
}: {
  initialValue?: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <RuDateInput
      aria-label="Дата публикации"
      mode="datetime"
      value={value}
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange(nextValue);
      }}
    />
  );
}

describe('RuDateInput datetime mode', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows a datetime-local value with the time after the Russian date', () => {
    render(<ControlledDateTimeInput initialValue="2026-07-10T03:00" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Дата публикации');

    expect(input).toHaveValue('10.07.2026 03:00');
    expect(input).toHaveAttribute('placeholder', 'ДД.ММ.ГГГГ ЧЧ:ММ');
  });

  it('reports the datetime-local value only once the time is complete', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDateTimeInput onChange={onChange} />);

    const input = screen.getByLabelText('Дата публикации');
    await user.type(input, '06092026');

    expect(input).toHaveValue('06.09.2026');
    expect(onChange).not.toHaveBeenCalled();

    await user.type(input, '1430');

    expect(onChange).toHaveBeenLastCalledWith('2026-09-06T14:30');
  });

  it('reports validity changes and resets draft on external value change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onValidityChange = vi.fn();

    function TestHarness() {
      const [val, setVal] = useState('2026-07-10T03:00');
      return (
        <div>
          <button type="button" onClick={() => setVal('2026-09-14T12:00')}>
            Set External
          </button>
          <RuDateInput
            aria-label="Дата публикации"
            mode="datetime"
            value={val}
            onChange={(next) => {
              setVal(next);
              onChange(next);
            }}
            onValidityChange={onValidityChange}
          />
        </div>
      );
    }

    render(<TestHarness />);
    const input = screen.getByLabelText('Дата публикации');
    expect(input).toHaveValue('10.07.2026 03:00');

    // Type partial/invalid date
    await user.clear(input);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);

    await user.type(input, '31022026');
    expect(onValidityChange).toHaveBeenLastCalledWith(false);

    // External value change resets draft and signals validity true
    await user.click(screen.getByRole('button', { name: 'Set External' }));
    expect(input).toHaveValue('14.09.2026 12:00');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });
});
