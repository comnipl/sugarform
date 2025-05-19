import { useForm } from '@sugarform/core';
import { renderHook, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextInput } from './textInput';

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

describe('Sugar#ready', () => {
  it('Sugar#get works', async () => {
    const { result } = renderHook(() => useForm<string>({ template: '' }));

    const get = result.current.get();

    expect(await checkPending(get)).toStrictEqual({ resolved: false });

    render(<TextInput sugar={result.current} />);

    expect(await checkPending(get)).toStrictEqual({
      resolved: true,
      value: {
        result: 'success',
        value: '',
      },
    });
  });
});
