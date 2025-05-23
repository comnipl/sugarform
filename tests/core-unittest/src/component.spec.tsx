import { NumberInput, TextInput, useForm } from '@sugarform/core';
import { render, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { checkPending } from '../util/checkPending';
import { describeWithStrict } from '../util/describeWithStrict';
import { Sugar } from '@sugarform/core';
import React from 'react';
import { SugarValue } from '../../../packages/core/dist/sugar/types';

const Components: Component[] = [
  { name: 'TextInput', template: '', Component: TextInput },
  { name: 'NumberInput', template: 0, Component: NumberInput },
] as Component[];

type Component = {
  name: string;
  template: SugarValue;
  Component: (
    props: Record<string, unknown> & { sugar: Sugar<SugarValue> }
  ) => React.ReactElement;
};

describeWithStrict('Component requirements', () => {
  describe.each<Component>(Components)('$name', (c) => {
    test('Component should be ready after render', async () => {
      const { result } = renderHook(() => useForm({ template: c.template }));
      const get = result.current.get();

      expect(await checkPending(get)).toStrictEqual({ resolved: false });

      render(<c.Component sugar={result.current} />);

      expect(await checkPending(get)).toStrictEqual({
        resolved: true,
        value: {
          result: 'success',
          value: c.template,
        },
      });
    });

    test('Sugar should be destroyed after unmount', async () => {
      const { result } = renderHook(() => useForm({ template: c.template }));
      const { unmount } = render(<c.Component sugar={result.current} />);
      await expect(result.current.get()).resolves.toStrictEqual({
        result: 'success',
        value: c.template,
      });
      unmount();
      await expect(result.current.get()).resolves.toStrictEqual({
        result: 'unavailable',
      });
    });
  });
});
