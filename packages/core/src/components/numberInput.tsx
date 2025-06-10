import { useEffect, useRef } from 'react';
import { Sugar } from '../lib';

export function NumberInput({
  sugar,
  ...props
}: { sugar: Sugar<number> } & React.ComponentPropsWithoutRef<'input'>) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      sugar.ready(
        (_submit) => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' });
          }
          return Promise.resolve({
            result: 'success',
            value: ref.current.valueAsNumber,
          });
        },
        (value) => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' });
          }
          ref.current.valueAsNumber = value;
          return Promise.resolve({ result: 'success' });
        }
      );
    }

    return () => sugar.destroy();
  }, [sugar]);

  return (
    <div>
      <input
        {...props}
        type="number"
        ref={ref}
        onChange={() => sugar.dispatchEvent('change')}
        onBlur={() => sugar.dispatchEvent('blur')}
      />
    </div>
  );
}
