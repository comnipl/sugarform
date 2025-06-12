import { TextInput, useForm } from '@sugarform/core';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#dispatchEvent', () => {
  test('Eventlisteners should be fired onChange', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const before_ready_listener = vi.fn();
    result.current.sugar.addEventListener('change', before_ready_listener);

    render(<TextInput sugar={result.current.sugar} />);

    const after_ready_listener = vi.fn();
    result.current.sugar.addEventListener('change', after_ready_listener);

    expect(before_ready_listener).toHaveBeenCalledTimes(0);
    expect(after_ready_listener).toHaveBeenCalledTimes(0);

    await userEvent.type(screen.getByRole('textbox'), 'test');

    await expect(result.current.sugar.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'test',
    });

    expect(before_ready_listener).toHaveBeenCalledTimes(4);
    expect(after_ready_listener).toHaveBeenCalledTimes(4);
  });

  test('Eventlisteners should be fired onBlur', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const before_ready_listener = vi.fn();
    result.current.sugar.addEventListener('blur', before_ready_listener);

    render(<TextInput sugar={result.current.sugar} />);

    const after_ready_listener = vi.fn();
    result.current.sugar.addEventListener('blur', after_ready_listener);

    await userEvent.type(screen.getByRole('textbox'), 'test');

    expect(before_ready_listener).toHaveBeenCalledTimes(0);
    expect(after_ready_listener).toHaveBeenCalledTimes(0);

    await userEvent.tab();

    await expect(result.current.sugar.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'test',
    });

    expect(before_ready_listener).toHaveBeenCalledTimes(1);
    expect(after_ready_listener).toHaveBeenCalledTimes(1);
  });
});
