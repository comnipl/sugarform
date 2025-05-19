import { useRef } from 'react';
import { SugarInner } from '../sugar';
import { Sugar, SugarValue } from '../sugar/types';

export const useForm = <T extends SugarValue>({
  template,
}: {
  template: T;
}) => {
  const sugar = useRef<Sugar<T>>(undefined);
  if (!sugar.current) {
    sugar.current = new SugarInner<T>(template);
  }
  return sugar.current;
};
