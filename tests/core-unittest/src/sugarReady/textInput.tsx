import { Sugar } from '@sugarform/core';
import { useEffect, useRef } from 'react';

export function TextInput({ sugar }: { sugar: Sugar<string> }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      sugar.ready(
        () => {
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
  }, [sugar]);

  return (
    <div>
      <input type="text" ref={ref} />
    </div>
  );
}
