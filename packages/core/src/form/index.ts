import { useRef } from 'react';
import { SugarInner } from '../sugar';
import { Sugar, SugarValue, SugarGetResult } from '../sugar/types';

export interface UseFormResult<T extends SugarValue> {
  sugar: Sugar<T>;
  collect: () => Promise<SugarGetResult<T>>;
}

export const useForm = <T extends SugarValue>({
  template,
}: {
  template: T;
}): UseFormResult<T> => {
  const sugar = useRef<Sugar<T>>(undefined);
  if (!sugar.current) {
    sugar.current = new SugarInner<T>(template);
  }

  const collect = (): Promise<SugarGetResult<T>> => sugar.current!.get(true);

  return { sugar: sugar.current, collect };
};
