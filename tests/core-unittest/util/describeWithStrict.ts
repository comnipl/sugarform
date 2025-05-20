import { configure } from '@testing-library/react';
import { beforeAll, describe } from 'vitest';

export const describeWithStrict = (name: string, fn: () => void) => {
  describe.each<'strict' | 'non-strict'>(['strict', 'non-strict'])(
    `${name} (%s mode)`,
    (mode) => {
      beforeAll(() => {
        configure({ reactStrictMode: mode === 'strict' });
      });
      fn();
    }
  );
};
