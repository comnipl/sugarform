import { useEffect, useRef, useState } from 'react';
import { Sugar } from './types';
import type { ValidationPhase } from './types';
import { SugarInner } from '.';

const phaseWeight: Record<ValidationPhase, number> = {
  input: 0,
  blur: 1,
  submit: 2,
};

export function useValidation<T, V>(
  sugar: Sugar<T>,
  validator: (
    value: T,
    fail: (reason: V, phase?: ValidationPhase) => void | Promise<void>
  ) => void | Promise<void>
): V[] {
  const validatorRef = useRef(validator);
  validatorRef.current = validator;

  const [validations, setValidations] = useState<V[]>([]);

  const run = async (value: T, phase: ValidationPhase): Promise<boolean> => {
    const fails: V[] = [];
    const fail = (v: V, p: ValidationPhase = 'submit') => {
      if (phaseWeight[phase] >= phaseWeight[p]) {
        fails.push(v);
      }
    };
    await validatorRef.current(value, fail);
    setValidations(fails);
    return fails.length === 0;
  };

  const wrapper = async (value: T, phase: ValidationPhase) => run(value, phase);

  /* eslint-disable react-hooks/exhaustive-deps -- validatorRef handles changes */
  useEffect(() => {
    const inner = sugar as unknown as SugarInner<T>;
    inner.addValidator(wrapper);

    const handleChange = async () => {
      const result = await sugar.get();
      if (result.result === 'success') {
        await run(result.value, 'input');
      }
    };
    const handleBlur = async () => {
      const result = await sugar.get();
      if (result.result === 'success') {
        await run(result.value, 'blur');
      }
    };
    sugar.addEventListener('change', handleChange);
    sugar.addEventListener('blur', handleBlur);

    return () => {
      inner.removeValidator(wrapper);
      sugar.removeEventListener('change', handleChange);
      sugar.removeEventListener('blur', handleBlur);
    };
  }, [sugar]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return validations;
}
