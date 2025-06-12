import { useEffect, useRef } from 'react';
import { Sugar, SugarGetResult, SugarValue } from './types';
import { SugarInner } from '.';

export type SugarTransformConfig<T extends SugarValue, U extends SugarValue> = {
  forward: (value: T) => Promise<U>;
  backward: (value: U) => Promise<T>;
};

export type SugarUseTransform<T extends SugarValue> = <U extends SugarValue>(
  config: SugarTransformConfig<T, U>
) => Sugar<U>;

export function useTransform<T extends SugarValue, U extends SugarValue>(
  sugar: Sugar<T>,
  config: SugarTransformConfig<T, U>
): Sugar<U> {
  const transformedSugar = useRef<Sugar<U>>(undefined);

  if (!transformedSugar.current) {
    const originalTemplate = (sugar as SugarInner<T>).template;
    transformedSugar.current = new SugarInner<U>(originalTemplate as unknown as U);
  }

  useEffect(() => {

    transformedSugar.current!.addEventListener('change', () =>
      sugar.dispatchEvent('change')
    );
    transformedSugar.current!.addEventListener('blur', () =>
      sugar.dispatchEvent('blur')
    );

    sugar.ready(
      async (submit) => {
        const transformedResult = await transformedSugar.current!.get(submit);
        if (transformedResult.result !== 'success') {
          return transformedResult as SugarGetResult<T>;
        }
        const originalValue = await config.backward(transformedResult.value);
        return {
          result: 'success',
          value: originalValue,
        };
      },
      async (value) => {
        const transformedValue = await config.forward(value);
        return await transformedSugar.current!.set(transformedValue);
      },
      async (value, executeSet = true) => {
        const transformedValue = await config.forward(value);
        return await transformedSugar.current!.setTemplate(
          transformedValue,
          executeSet
        );
      }
    );

    return () => {
      transformedSugar.current!.destroy();
    };
  }, [sugar, config]);

  return transformedSugar.current!;
}
