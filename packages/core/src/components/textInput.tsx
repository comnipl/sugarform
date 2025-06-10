import { useEffect, useRef } from 'react';
import { Sugar } from '../lib';

export function TextInput({
  sugar,
  ...props
}: { sugar: Sugar<string> } & React.ComponentPropsWithoutRef<'input'>) {
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
            value: ref.current.value,
          });
        },
        (value) => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' });
          }
          ref.current.value = value;
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
        type="text"
        ref={ref}
        onChange={() => sugar.dispatchEvent('change')}
        onBlur={() => sugar.dispatchEvent('blur')}
      />
    </div>
  );
}
