import { useForm, TextInput } from '@sugarform/core';
import { render, renderHook, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#useObject', () => {
  test('useObject should propagate onChange event', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '', b: '' } })
    );
    const { result: object } = renderHook(() =>
      sugar.current.sugar.useObject()
    );

    const onChange = vi.fn();
    sugar.current.sugar.addEventListener('change', onChange);

    render(<TextInput sugar={object.current.fields.a} placeholder="a" />);
    render(<TextInput sugar={object.current.fields.b} placeholder="b" />);
    const inputA = screen.getByPlaceholderText('a');
    const inputB = screen.getByPlaceholderText('b');
    const user = userEvent.setup();

    expect(onChange).toHaveBeenCalledTimes(0);

    await user.type(inputA, 'testA');
    expect(onChange).toHaveBeenCalledTimes(5);

    await user.type(inputB, 'testB');
    expect(onChange).toHaveBeenCalledTimes(10);

    await expect(sugar.current.sugar.get()).resolves.toStrictEqual({
      result: 'success',
      value: { a: 'testA', b: 'testB' },
    });
  });

  test('useObject should propagate onBlur event', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '', b: '' } })
    );
    const { result: object } = renderHook(() =>
      sugar.current.sugar.useObject()
    );

    const onBlur = vi.fn();
    sugar.current.sugar.addEventListener('blur', onBlur);

    render(<TextInput sugar={object.current.fields.a} placeholder="a" />);
    render(<TextInput sugar={object.current.fields.b} placeholder="b" />);
    const inputA = screen.getByPlaceholderText('a');
    const inputB = screen.getByPlaceholderText('b');
    const user = userEvent.setup();

    expect(onBlur).toHaveBeenCalledTimes(0);

    await user.type(inputA, 'testA');
    expect(onBlur).toHaveBeenCalledTimes(0);

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);

    await user.type(inputB, 'testB');
    expect(onBlur).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(2);

    await expect(sugar.current.sugar.get()).resolves.toStrictEqual({
      result: 'success',
      value: { a: 'testA', b: 'testB' },
    });
  });
});
