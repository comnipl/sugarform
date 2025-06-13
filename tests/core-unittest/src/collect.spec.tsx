import { TextInput, NumberInput, useForm } from '@sugarform/core';
import { renderHook, render, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('useForm#collect', () => {
  test('collect method should be equivalent to sugar.get(true)', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: 'initial' } })
    );

    render(<TextInput sugar={result.current.sugar} />);
    await act(async () => {});

    const collectResult = await result.current.collect();
    const getResult = await result.current.sugar.get(true);

    expect(collectResult).toStrictEqual(getResult);
    expect(collectResult).toStrictEqual({
      result: 'success',
      value: 'initial',
    });
  });

  test('collect method should trigger validation like sugar.get(true)', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: { a: '' } } })
    );
    const { result: obj } = renderHook(() => result.current.sugar.useObject());

    const validate = async (
      v: string,
      fail: (e: string, s?: string) => void
    ) => {
      if (v === '') fail('required', 'submit');
    };
    render(<TextInput sugar={obj.current.fields.a} placeholder="a" />);
    renderHook(() => obj.current.fields.a.useValidation(validate));

    await act(async () => {});

    const collectResult = await result.current.collect();
    const getResult = await result.current.sugar.get(true);

    expect(collectResult).toStrictEqual(getResult);
    expect(collectResult).toStrictEqual({
      result: 'validation_fault',
    });
  });

  test('collect method should return the same type as sugar.get(true)', async () => {
    const { result } = renderHook(() =>
      useForm({
        template: { status: 'resolved', value: { name: 'John', age: 25 } },
      })
    );
    const { result: obj } = renderHook(() => result.current.sugar.useObject());

    render(
      <>
        <TextInput sugar={obj.current.fields.name} />
        <NumberInput sugar={obj.current.fields.age} />
      </>
    );
    await act(async () => {});

    const collectResult = await result.current.collect();

    expect(collectResult).toStrictEqual({
      result: 'success',
      value: { name: 'John', age: 25 },
    });
  });
});
