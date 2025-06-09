import { TextInput, useForm } from '@sugarform/core';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#useValidation', () => {
  test('validation triggered on blur until success', async () => {
    const { result: sugar } = renderHook(() => useForm<string>({ template: '' }));
    const { result: validations } = renderHook(() =>
      sugar.current.useValidation<string>((value, fail) => {
        if (value === '') fail('required', 'blur');
      })
    );

    render(<TextInput sugar={sugar.current} />);

    expect(validations.current).toStrictEqual([]);

    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();

    expect(validations.current).toStrictEqual(['required']);

    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.tab();

    expect(validations.current).toStrictEqual([]);
  });

  test('get(true) returns validation_fault until valid', async () => {
    const { result: sugar } = renderHook(() => useForm<string>({ template: '' }));
    renderHook(() =>
      sugar.current.useValidation<string>((value, fail) => {
        if (value === '') fail('required', 'blur');
      })
    );
    render(<TextInput sugar={sugar.current} />);

    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();

    await expect(sugar.current.get(true)).resolves.toStrictEqual({
      result: 'validation_fault',
    });

    await userEvent.type(screen.getByRole('textbox'), 'b');
    await userEvent.tab();

    await expect(sugar.current.get(true)).resolves.toStrictEqual({
      result: 'success',
      value: 'b',
    });

    await expect(sugar.current.get()).resolves.toStrictEqual({
      result: 'success',
      value: 'b',
    });
  });

  test('age must be at least 18', async () => {
    const { result: sugar } = renderHook(() => useForm<string>({ template: '' }));
    renderHook(() =>
      sugar.current.useValidation<string>((value, fail) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          fail('invalid', 'blur');
          return;
        }
        const now = new Date();
        let age = now.getFullYear() - date.getFullYear();
        const m = now.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < date.getDate())) {
          age--;
        }
        if (age < 18) {
          fail('underage', 'submit');
        }
      })
    );
    render(<TextInput sugar={sugar.current} />);
    const input = screen.getByRole('textbox');

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const now = new Date();
    const underage = new Date(now.getFullYear() - 17, now.getMonth(), now.getDate());
    const adult = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate() - 1);

    await userEvent.type(input, fmt(underage));
    await userEvent.tab();

    await expect(sugar.current.get(true)).resolves.toStrictEqual({
      result: 'validation_fault',
    });

    await userEvent.clear(input);
    await userEvent.type(input, fmt(adult));
    await userEvent.tab();

    await expect(sugar.current.get(true)).resolves.toStrictEqual({
      result: 'success',
      value: fmt(adult),
    });
  });
});
