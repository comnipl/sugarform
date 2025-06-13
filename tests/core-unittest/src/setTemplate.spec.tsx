import { TextInput, useForm } from '@sugarform/core';
import { renderHook, render, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { describeWithStrict } from '../util/describeWithStrict';
import { SugarInner } from '../../../packages/core/src/sugar/index';

describeWithStrict('Sugar#setTemplate', () => {
  test('setTemplate(value, true) updates template and executes set (default behavior)', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: 'original' } })
    );

    render(<TextInput sugar={result.current.sugar} />);
    await act(async () => {});

    await result.current.sugar.setTemplate('new template', true);

    const getResult = await result.current.sugar.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'new template',
    });

    expect((result.current.sugar as SugarInner<string>).template).toStrictEqual(
      {
        status: 'resolved',
        value: 'new template',
      }
    );
  });

  test('setTemplate(value, false) updates template only without executing set', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: 'original' } })
    );

    render(<TextInput sugar={result.current.sugar} />);
    await act(async () => {});

    await result.current.sugar.set('current value');
    await result.current.sugar.setTemplate('new template', false);

    const getResult = await result.current.sugar.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'current value',
    });

    expect((result.current.sugar as SugarInner<string>).template).toStrictEqual(
      {
        status: 'resolved',
        value: 'new template',
      }
    );
  });

  test('setTemplate without executeSet parameter defaults to true', async () => {
    const { result } = renderHook(() =>
      useForm({ template: { status: 'resolved', value: 'original' } })
    );

    render(<TextInput sugar={result.current.sugar} />);
    await act(async () => {});

    await result.current.sugar.setTemplate('new template');

    const getResult = await result.current.sugar.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: 'new template',
    });

    expect((result.current.sugar as SugarInner<string>).template).toStrictEqual(
      {
        status: 'resolved',
        value: 'new template',
      }
    );
  });

  test('setTemplate works with nested objects', async () => {
    const { result } = renderHook(() =>
      useForm({
        template: { status: 'resolved', value: { a: 'initial', b: 'initial' } },
      })
    );
    const { result: obj } = renderHook(() => result.current.sugar.useObject());

    render(
      <>
        <TextInput sugar={obj.current.fields.a} />
        <TextInput sugar={obj.current.fields.b} />
      </>
    );
    await act(async () => {});

    await result.current.sugar.setTemplate({ a: 'new-a', b: 'new-b' }, true);

    const getResult = await result.current.sugar.get();
    expect(getResult).toStrictEqual({
      result: 'success',
      value: { a: 'new-a', b: 'new-b' },
    });

    expect(
      (result.current.sugar as SugarInner<{ a: string; b: string }>).template
    ).toStrictEqual({ status: 'resolved', value: { a: 'new-a', b: 'new-b' } });

    expect((obj.current.fields.a as SugarInner<string>).template).toStrictEqual(
      {
        status: 'resolved',
        value: 'new-a',
      }
    );
    expect((obj.current.fields.b as SugarInner<string>).template).toStrictEqual(
      {
        status: 'resolved',
        value: 'new-b',
      }
    );
  });
});
