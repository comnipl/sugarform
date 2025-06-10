import { useCallback, useEffect, useState } from 'react';
import { SugarInner } from '.';
import { Sugar, SugarValue, ValidationStage, FailFn } from './types';

export function useValidation<T extends SugarValue, V>(
  sugar: Sugar<T>,
  validator: (value: T, fail: FailFn<V>) => void | Promise<void>,
  deps: React.DependencyList = []
): V[] {
  const [errors, setErrors] = useState<V[]>([]);

  const validatorWrapper = useCallback(
    async (stage: ValidationStage, value: T) => {
      const fails: V[] = [];
      const fail: FailFn<V> = (v, s = 'submit') => {
        const order = { input: 0, blur: 1, submit: 2 } as const;
        if (order[stage] >= order[s]) {
          fails.push(v);
        }
      };
      await validator(value, fail);
      setErrors(fails);
      return fails.length === 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Spread is required to include user deps
    [validator, ...deps]
  );

  useEffect(() => {
    // Casting is safe because useValidation is always used with SugarInner
    // instances produced by useForm or useObject
    (sugar as unknown as SugarInner<T>).registerValidator(validatorWrapper);
    return () => {
      // same reasoning as above
      (sugar as unknown as SugarInner<T>).unregisterValidator(validatorWrapper);
    };
  }, [sugar, validatorWrapper]);

  const run = useCallback(
    async (stage: ValidationStage) => {
      // Casting is safe because sugar is created via SugarInner
      const inner = sugar as unknown as SugarInner<T>;
      const result = await inner.getInternal(stage);
      if (result.result !== 'success') {
        setErrors([]);
        return;
      }
      await validatorWrapper(stage, result.value);
    },
    [sugar, validatorWrapper]
  );

  useEffect(() => {
    const onChange = () => run('input');
    const onBlur = () => run('blur');
    sugar.addEventListener('change', onChange);
    sugar.addEventListener('blur', onBlur);
    return () => {
      sugar.removeEventListener('change', onChange);
      sugar.removeEventListener('blur', onBlur);
    };
  }, [run, sugar]);

  // run once on mount
  useEffect(() => {
    run('input');
  }, [run]);

  return errors;
}
