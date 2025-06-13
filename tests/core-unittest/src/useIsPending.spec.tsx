import { TextInput, useForm } from '@sugarform/core';
import { renderHook, render, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#useIsPending', () => {
  test('returns false when template is resolved', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: 'test' } })
    );

    const { result: isPendingResult } = renderHook(() =>
      result.current.sugar.useIsPending()
    );

    expect(isPendingResult.current).toBe(false);
  });

  test('returns true when template is pending', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'pending' } })
    );

    const { result: isPendingResult } = renderHook(() =>
      result.current.sugar.useIsPending()
    );

    expect(isPendingResult.current).toBe(true);
  });

  test('returns false when template is undefined', async () => {
    const { result } = renderHook(() => useForm({ template: undefined }));

    const { result: isPendingResult } = renderHook(() =>
      result.current.sugar.useIsPending()
    );

    expect(isPendingResult.current).toBe(false);
  });

  test('updates when template changes from pending to resolved', async () => {
    const { result } = renderHook(() =>
      useForm<string>({ template: { status: 'pending' } })
    );

    const { result: isPendingResult } = renderHook(() =>
      result.current.sugar.useIsPending()
    );

    render(<TextInput sugar={result.current.sugar} />);
    await act(async () => {});

    expect(isPendingResult.current).toBe(true);

    await act(async () => {
      await result.current.sugar.setTemplate('resolved value');
    });

    expect(isPendingResult.current).toBe(false);
  });

  test('propagates pending state to nested objects', async () => {
    const { result } = renderHook(() =>
      useForm<{ a: string }>({ template: { status: 'pending' } })
    );
    const { result: obj } = renderHook(() => result.current.sugar.useObject());

    const { result: childIsPendingResult } = renderHook(() =>
      obj.current.fields.a.useIsPending()
    );

    expect(childIsPendingResult.current).toBe(true);
  });

  test('updates nested objects when parent template changes', async () => {
    const { result } = renderHook(() =>
      useForm<{ a: string; b: string }>({ template: { status: 'pending' } })
    );
    const { result: obj } = renderHook(() => result.current.sugar.useObject());

    render(
      <>
        <TextInput sugar={obj.current.fields.a} />
        <TextInput sugar={obj.current.fields.b} />
      </>
    );
    await act(async () => {});

    const { result: childAIsPendingResult } = renderHook(() =>
      obj.current.fields.a.useIsPending()
    );
    const { result: childBIsPendingResult } = renderHook(() =>
      obj.current.fields.b.useIsPending()
    );

    expect(childAIsPendingResult.current).toBe(true);
    expect(childBIsPendingResult.current).toBe(true);

    await act(async () => {
      await result.current.sugar.setTemplate({ a: 'value-a', b: 'value-b' });
    });

    expect(childAIsPendingResult.current).toBe(false);
    expect(childBIsPendingResult.current).toBe(false);
  });
});
