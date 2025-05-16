import { SugarInner } from '../sugar';
import { Sugar, SugarValue } from '../sugar/types';

export const useForm = <T extends SugarValue>({
  template,
}: {
  template: T;
}) => {
  const sugar: Sugar<T> = new SugarInner<T>(template);
  return sugar;
};
