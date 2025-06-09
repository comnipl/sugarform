import { useCallback, useEffect, useState } from 'react';
import { Sugar, SugarValue, ValidationStage, FailFn } from './types';

export function useValidation<T extends SugarValue, V>(
  sugar: Sugar<T>,
  validator: (value: T, fail: FailFn<V>) => void | Promise<void>,
  deps: React.DependencyList = []
): V[] {
  const [errors, setErrors] = useState<V[]>([]);

  const run = useCallback(
    async (stage: ValidationStage) => {
      const result = await sugar.get();
      if (result.result !== 'success') {
        setErrors([]);
        return;
      }
      const fails: V[] = [];
      const fail: FailFn<V> = (v, s = 'submit') => {
        const order = { input: 0, blur: 1, submit: 2 } as const;
        if (order[stage] >= order[s]) {
          fails.push(v);
        }
      };
      await validator(result.value, fail);
      setErrors(fails);
    },
    // Spread deps is necessary to allow user-defined dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Spread is required to include user deps
    [sugar, validator, ...deps]
  );

  useEffect(() => {
    const onChange = () => run('input');
    const onBlur = () => run('blur');
    const onSubmit = () => run('submit');
    sugar.addEventListener('change', onChange);
    sugar.addEventListener('blur', onBlur);
    sugar.addEventListener('submit', onSubmit);
    return () => {
      sugar.removeEventListener('change', onChange);
      sugar.removeEventListener('blur', onBlur);
      sugar.removeEventListener('submit', onSubmit);
    };
  }, [run, sugar]);

  // run once on mount
  useEffect(() => {
    run('input');
  }, [run]);

  return errors;
}
