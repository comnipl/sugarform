import { TextInput, useForm } from '@sugarform/core';
import { renderHook, render, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';

describeWithStrict('Sugar#setTemplate', () => {
  test('setTemplate(value, true) updates template and executes set (default behavior)', async () => {
    const { result } = renderHook(() =>
      useForm<string>({ template: 'original' })
    );

    render(<TextInput sugar={result.current} />);

    await act(async () => {
      await result.current.setTemplate('new template', true);
    });

    const getResult = await result.current.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'new template',
    });
  });

  test('setTemplate(value, false) updates template only without executing set', async () => {
    const { result } = renderHook(() =>
      useForm<string>({ template: 'original' })
    );

    render(<TextInput sugar={result.current} />);

    await act(async () => {
      await result.current.set('current value');
      await result.current.setTemplate('new template', false);
    });

    const getResult = await result.current.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'current value',
    });
  });

  test('setTemplate without executeSet parameter defaults to true', async () => {
    const { result } = renderHook(() =>
      useForm<string>({ template: 'original' })
    );

    render(<TextInput sugar={result.current} />);

    await act(async () => {
      await result.current.setTemplate('new template');
    });

    const getResult = await result.current.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'new template',
    });
  });

  test('setTemplate works with nested objects', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { a: 'initial', b: 'initial' } })
    );
    const { result: obj } = renderHook(() => result.current.useObject());

    render(
      <>
        <TextInput sugar={obj.current.fields.a} />
        <TextInput sugar={obj.current.fields.b} />
      </>
    );

    await act(async () => {
      await result.current.setTemplate({ a: 'new', b: 'new' }, true);
    });

    const getResult = await result.current.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: { a: 'new', b: 'new' },
    });
  });

  test('regular set method remains unchanged', async () => {
    const { result } = renderHook(() =>
      useForm<string>({ template: 'original' })
    );

    render(<TextInput sugar={result.current} />);

    await act(async () => {
      await result.current.set('new value');
    });

    const getResult = await result.current.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'new value',
    });
  });
});
