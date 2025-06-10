import { TextInput, useForm } from '@sugarform/core';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#dispatchEvent', () => {
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

  test('onChange should be dispatched after programmatic set() call', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const onChange = vi.fn();
    result.current.addEventListener('change', onChange);

    render(<TextInput sugar={result.current} />);

    await result.current.get();

    expect(onChange).toHaveBeenCalledTimes(0);

    await result.current.set('programmatic value');

    expect(onChange).toHaveBeenCalledTimes(1);

    await expect(result.current.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'programmatic value',
    });
  });

  test('onChange should be dispatched for nested object set() calls', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '', b: '' } })
    );
    const { result: object } = renderHook(() => sugar.current.useObject());

    const onChange = vi.fn();
    sugar.current.addEventListener('change', onChange);

    render(<TextInput sugar={object.current.fields.a} placeholder="a" />);

    await object.current.fields.a.get();

    expect(onChange).toHaveBeenCalledTimes(0);

    await object.current.fields.a.set('nested value');

    expect(onChange).toHaveBeenCalledTimes(1);

    await expect(object.current.fields.a.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'nested value',
    });
  });

  test('onChange should be dispatched when set() is called before ready', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const onChange = vi.fn();
    result.current.addEventListener('change', onChange);

    const setPromise = result.current.set('before ready');

    expect(onChange).toHaveBeenCalledTimes(0);

    render(<TextInput sugar={result.current} />);

    await setPromise;

    expect(onChange).toHaveBeenCalledTimes(1);

    await expect(result.current.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'before ready',
    });
  });
});
