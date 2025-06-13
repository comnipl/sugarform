import { useForm, TextInput } from '@sugarform/core';
import { render, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';

test('useTransform basic functionality', async () => {
  const { result: form } = renderHook(() =>
    useForm<string | null>({ template: null })
  );

  const { result: transformedSugar } = renderHook(() =>
    form.current.sugar.useTransform<string>({
      forward: async (value: string | null) => value ?? '',
      backward: async (value: string) => (value === '' ? null : value),
    })
  );

  render(<TextInput sugar={transformedSugar.current} placeholder="input" />);

  await expect(form.current.sugar.get()).resolves.toStrictEqual({
    result: 'success',
    value: null,
  });

  await expect(transformedSugar.current.get()).resolves.toStrictEqual({
    result: 'success',
    value: '',
  });

  await transformedSugar.current.set('test');

  await expect(form.current.sugar.get()).resolves.toStrictEqual({
    result: 'success',
    value: 'test',
  });

  await expect(transformedSugar.current.get()).resolves.toStrictEqual({
    result: 'success',
    value: 'test',
  });

  await transformedSugar.current.set('');

  await expect(form.current.sugar.get()).resolves.toStrictEqual({
    result: 'success',
    value: null,
  });

  await expect(transformedSugar.current.get()).resolves.toStrictEqual({
    result: 'success',
    value: '',
  });
});
