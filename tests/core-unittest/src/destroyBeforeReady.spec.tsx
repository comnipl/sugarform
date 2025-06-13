import { useForm } from '@sugarform/core';
import { renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';
import { checkPending } from '../util/checkPending';

describeWithStrict('Sugar#destroy before ready', () => {
  test('destroy resolves pending promises', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: '' } })
    );

    const getPromise = result.current.sugar.get();
    const setPromise = result.current.sugar.set('test');

    expect(await checkPending(getPromise)).toStrictEqual({ resolved: false });
    expect(await checkPending(setPromise)).toStrictEqual({ resolved: false });

    result.current.sugar.destroy();

    await expect(getPromise).resolves.toStrictEqual({ result: 'unavailable' });
    await expect(setPromise).resolves.toStrictEqual({ result: 'unavailable' });
  });
});
