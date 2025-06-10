import { NumberInput, useForm, type Sugar } from '@sugarform/core';
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

type ValidationResult =
  | { type: 'missed'; name: ('year' | 'month' | 'day')[] }
  | { type: 'young' };

function toMessage(v: ValidationResult): string {
  switch (v.type) {
    case 'missed':
      return `${v.name.join(', ')} missing`;
    case 'young':
      return 'too young';
  }
}

const validator = async (
  value: Birthday,
  fail: (v: ValidationResult, s?: string) => void
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

function BirthdayInput({ sugar }: { sugar: Sugar<Birthday> }) {
  const { fields } = sugar.useObject();
  const errors = sugar.useValidation(validator);

  return (
    <div>
      <NumberInput sugar={fields.year} placeholder="y" />
      <NumberInput sugar={fields.month} placeholder="m" />
      <NumberInput sugar={fields.day} placeholder="d" />
      {errors.map((e, i) => (
        <div key={i} role="alert">
          {toMessage(e)}
        </div>
      ))}
    </div>
  );
}

describeWithStrict('BirthdayInput', () => {
  test('shows missing fields on submit', async () => {
    const { result } = renderHook(() =>
      useForm<Birthday>({ template: { year: NaN, month: NaN, day: NaN } })
    );
    render(<BirthdayInput sugar={result.current} />);
    await act(async () => {});

    expect(screen.queryAllByRole('alert')).toHaveLength(0);

    await act(async () => {
      await result.current.get(true);
    });

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].textContent).toBe('year, month, day missing');
    });
  });

  test('shows age error on blur and clears after correction', async () => {
    const { result } = renderHook(() =>
      useForm<Birthday>({ template: { year: NaN, month: NaN, day: NaN } })
    );
    render(<BirthdayInput sugar={result.current} />);
    await act(async () => {});
    const user = userEvent.setup();
    const year = screen.getByPlaceholderText('y');
    const month = screen.getByPlaceholderText('m');
    const day = screen.getByPlaceholderText('d');

    await user.type(year, '2010');
    await user.type(month, '1');
    await user.type(day, '1');
    await user.tab();

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].textContent).toBe('too young');
    });

    await user.clear(year);
    await user.type(year, '2000');
    await user.tab();

    await waitFor(() => {
      expect(screen.queryAllByRole('alert')).toHaveLength(0);
    });
  });
});
