import { TextInput, useForm } from '@sugarform/core';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#useValidation', () => {
  test('submit events from get propagate to nested sugars', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '', b: '' } })
    );
    const { result: obj } = renderHook(() => sugar.current.sugar.useObject());

    const validateA = async (
      v: string,
      fail: (err: string, s?: string) => void
    ) => {
      if (v === '') fail('required', 'submit');
    };
    const validateB = async (
      v: string,
      fail: (err: string, s?: string) => void
    ) => {
      if (v === '') fail('required', 'submit');
    };

    const { result: errA } = renderHook(() =>
      obj.current.fields.a.useValidation(validateA)
    );
    const { result: errB } = renderHook(() =>
      obj.current.fields.b.useValidation(validateB)
    );

    render(
      <>
        <TextInput sugar={obj.current.fields.a} placeholder="a" />
        <TextInput sugar={obj.current.fields.b} placeholder="b" />
      </>
    );
    await act(async () => {});

    const user = userEvent.setup();
    const inputA = screen.getByPlaceholderText('a');
    await user.type(inputA, 'filled');

    expect(errA.current).toStrictEqual([]);
    expect(errB.current).toStrictEqual([]);

    await act(async () => {
      await sugar.current.sugar.get(true);
    });

    await waitFor(() => expect(errA.current).toStrictEqual([]));
    await waitFor(() => expect(errB.current).toStrictEqual(['required']));
  });

  test('get returns validation_fault when validation fails', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '' } })
    );
    const { result: obj } = renderHook(() => sugar.current.sugar.useObject());

    const validate = async (
      v: string,
      fail: (e: string, s?: string) => void
    ) => {
      if (v === '') fail('required', 'submit');
    };
    render(<TextInput sugar={obj.current.fields.a} placeholder="a" />);
    renderHook(() => obj.current.fields.a.useValidation(validate));

    await act(async () => {});

    await act(async () => {
      await expect(sugar.current.sugar.get(true)).resolves.toStrictEqual({
        result: 'validation_fault',
      });
    });
  });
});
