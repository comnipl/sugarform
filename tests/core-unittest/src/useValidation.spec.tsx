import { NumberInput, TextInput, useForm } from '@sugarform/core';
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

type Birthday = {
  year: number;
  month: number;
  day: number;
};

describeWithStrict('Sugar#useValidation', () => {
  test('validator triggers by stage as in issue example', async () => {
    const { result: sugar } = renderHook(() =>
      useForm<Birthday>({ template: { year: NaN, month: NaN, day: NaN } })
    );
    const { result: object } = renderHook(() => sugar.current.useObject());

    const validator = async (
      value: Birthday,
      fail: (v: unknown, s?: string) => void
    ) => {
      const complete =
        !Number.isNaN(value.year) &&
        !Number.isNaN(value.month) &&
        !Number.isNaN(value.day);
      if (!complete) {
        const missed: ('year' | 'month' | 'day')[] = [];
        if (Number.isNaN(value.year)) missed.push('year');
        if (Number.isNaN(value.month)) missed.push('month');
        if (Number.isNaN(value.day)) missed.push('day');
        fail({ type: 'missed', name: missed }, 'submit');
        return;
      }
      const birthday = new Date(value.year, value.month - 1, value.day);
      const today = new Date(2025, 0, 1);
      const age = today.getFullYear() - birthday.getFullYear();
      const passed =
        today.getMonth() > birthday.getMonth() ||
        (today.getMonth() === birthday.getMonth() &&
          today.getDate() >= birthday.getDate());
      if (age < 20 || (age === 20 && !passed)) {
        fail({ type: 'young' }, 'blur');
      }
    };

    const { result: errors } = renderHook(() =>
      sugar.current.useValidation(validator)
    );

    render(
      <>
        <NumberInput sugar={object.current.fields.year} placeholder="y" />
        <NumberInput sugar={object.current.fields.month} placeholder="m" />
        <NumberInput sugar={object.current.fields.day} placeholder="d" />
      </>
    );
    await act(async () => {});

    const user = userEvent.setup();
    const year = screen.getByPlaceholderText('y');
    const month = screen.getByPlaceholderText('m');
    const day = screen.getByPlaceholderText('d');

    expect(errors.current).toStrictEqual([]);

    await act(async () => {
      await sugar.current.get('submit');
    });
    await waitFor(() =>
      expect(errors.current).toStrictEqual([
        { type: 'missed', name: ['year', 'month', 'day'] },
      ])
    );

    await user.type(year, '2010');
    await user.type(month, '1');
    await user.type(day, '1');
    expect(errors.current).toStrictEqual([]);

    await user.tab();
    await waitFor(() =>
      expect(errors.current).toStrictEqual([{ type: 'young' }])
    );

    await user.clear(year);
    await user.type(year, '2000');
    await user.tab();
    await waitFor(() => expect(errors.current).toStrictEqual([]));
  });

  test('submit events from get propagate to nested sugars', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '', b: '' } })
    );
    const { result: obj } = renderHook(() => sugar.current.useObject());

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
      await sugar.current.get('submit');
    });

    await waitFor(() => expect(errA.current).toStrictEqual([]));
    await waitFor(() => expect(errB.current).toStrictEqual(['required']));
  });

  test('get returns validation_fault when validation fails', async () => {
    const { result: sugar } = renderHook(() =>
      useForm({ template: { a: '' } })
    );
    const { result: obj } = renderHook(() => sugar.current.useObject());

    const validate = async (
      v: string,
      fail: (e: string, s?: string) => void
    ) => {
      if (v === '') fail('required', 'submit');
    };
    render(<TextInput sugar={obj.current.fields.a} placeholder="a" />);
    renderHook(() => obj.current.fields.a.useValidation(validate));

    await act(async () => {});

    await expect(sugar.current.get('submit')).resolves.toStrictEqual({
      result: 'validation_fault',
    });
  });
});
