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

  test('bidirectional propagation in complex nested structure', async () => {
    const { result: sugarA } = renderHook(() =>
      useForm({ template: { b: '', c: { d: '', e: '' } } })
    );
    const { result: objectA } = renderHook(() => sugarA.current.useObject());
    const { result: objectC } = renderHook(() =>
      objectA.current.fields.c.useObject()
    );

    const onChangeA = vi.fn();
    const onChangeC = vi.fn();
    const onChangeD = vi.fn();
    const onChangeE = vi.fn();

    sugarA.current.addEventListener('change', onChangeA);
    objectA.current.fields.c.addEventListener('change', onChangeC);
    objectC.current.fields.d.addEventListener('change', onChangeD);
    objectC.current.fields.e.addEventListener('change', onChangeE);

    render(<TextInput sugar={objectC.current.fields.d} placeholder="d" />);
    render(<TextInput sugar={objectC.current.fields.e} placeholder="e" />);

    await objectC.current.fields.d.get();
    await objectC.current.fields.e.get();
    await objectA.current.fields.c.get(); // Ensure C is also ready

    expect(onChangeA).toHaveBeenCalledTimes(0);
    expect(onChangeC).toHaveBeenCalledTimes(0);
    expect(onChangeD).toHaveBeenCalledTimes(0);
    expect(onChangeE).toHaveBeenCalledTimes(0);

    await objectA.current.fields.c.set({ d: 'new_d', e: 'new_e' });

    expect(onChangeA).toHaveBeenCalledTimes(1);
    expect(onChangeC).toHaveBeenCalledTimes(1);
    expect(onChangeD).toHaveBeenCalledTimes(1);
    expect(onChangeE).toHaveBeenCalledTimes(1);

    await expect(objectC.current.fields.d.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'new_d',
    });
    await expect(objectC.current.fields.e.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'new_e',
    });
  });
});
