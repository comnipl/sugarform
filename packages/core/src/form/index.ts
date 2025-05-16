import { Sugar } from '../sugar';
import { SugarValue } from '../sugar/types';

export const useForm = <T extends SugarValue>({
  template,
}: {
  template: T;
}) => {
  const sugar = new Sugar<T>(template);
  return sugar;
};
