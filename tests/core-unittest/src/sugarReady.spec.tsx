import { TextInput, useForm } from '@sugarform/core';
import { renderHook, render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

async function checkPending<T>(
  promise: Promise<T>
): Promise<{ resolved: false } | { resolved: true; value: T }> {
  const finish = Symbol();
  const value = await Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(finish);
      }, 0);
    }),
  ]);
  if (value === finish) {
    return { resolved: false };
  }
  return { resolved: true, value: value as T };
}

describeWithStrict('Sugar#ready', () => {
  test('getPromise is Pending until Ready', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const get = result.current.sugar.get();

    expect(await checkPending(get)).toStrictEqual({ resolved: false });

    render(<TextInput sugar={result.current.sugar} />);

    expect(await checkPending(get)).toStrictEqual({
      resolved: true,
      value: {
        result: 'success',
        value: '',
      },
    });
  });

  test('setPromise is Pending until Ready', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const set = result.current.sugar.set('test');

    expect(await checkPending(set)).toStrictEqual({ resolved: false });

    render(<TextInput sugar={result.current.sugar} />);

    expect(await checkPending(set)).toStrictEqual({
      resolved: true,
      value: {
        result: 'success',
      },
    });
  });

  test('getPromise returns value given by setter', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));
    const get = result.current.sugar.get();
    const set = result.current.sugar.set('test');
    expect(await checkPending(get)).toStrictEqual({ resolved: false });
    expect(await checkPending(set)).toStrictEqual({ resolved: false });

    render(<TextInput sugar={result.current.sugar} />);
    expect(await checkPending(get)).toStrictEqual({
      resolved: true,
      value: {
        result: 'success',
        value: 'test',
      },
    });
    expect(await checkPending(set)).toStrictEqual({
      resolved: true,
      value: {
        result: 'success',
      },
    });
  });
});
