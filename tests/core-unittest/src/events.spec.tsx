import { useForm } from '@sugarform/core';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { TextInput } from './components/textInput';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#dispatchEvent', async () => {
  test('Eventlisteners should be fired onChange', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const before_ready_listener = vi.fn();
    result.current.addEventListener('change', before_ready_listener);

    render(<TextInput sugar={result.current} />);

    const after_ready_listener = vi.fn();
    result.current.addEventListener('change', after_ready_listener);

    expect(before_ready_listener).toHaveBeenCalledTimes(0);
    expect(after_ready_listener).toHaveBeenCalledTimes(0);

    await userEvent.type(screen.getByRole('textbox'), 'test');

    await expect(result.current.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'test',
    });

    expect(before_ready_listener).toHaveBeenCalledTimes(4);
    expect(after_ready_listener).toHaveBeenCalledTimes(4);
  });

  test('Eventlisteners should be fired onBlur', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const before_ready_listener = vi.fn();
    result.current.addEventListener('blur', before_ready_listener);

    render(<TextInput sugar={result.current} />);

    const after_ready_listener = vi.fn();
    result.current.addEventListener('blur', after_ready_listener);

    await userEvent.type(screen.getByRole('textbox'), 'test');

    expect(before_ready_listener).toHaveBeenCalledTimes(0);
    expect(after_ready_listener).toHaveBeenCalledTimes(0);

    await userEvent.tab();

    await expect(result.current.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'test',
    });

    expect(before_ready_listener).toHaveBeenCalledTimes(1);
    expect(after_ready_listener).toHaveBeenCalledTimes(1);
  });
});
