import { TextInput, useForm } from '@sugarform/core';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#useValidation', () => {
  test('validation triggered on blur', async () => {
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
  });

  test('get(true) returns validation_fault', async () => {
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

    await expect(sugar.current.get()).resolves.toStrictEqual({
      result: 'success',
      value: '',
    });
  });
});
