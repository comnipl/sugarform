import { useEffect, useState } from 'react';
import { SugarInner } from '.';
import { Sugar, SugarValue } from './types';

export type SugarUseIsPending = () => boolean;

export function useIsPending<T extends SugarValue>(sugar: Sugar<T>): boolean {
  const [isPending, setIsPending] = useState<boolean>(() => {
    const sugarInner = sugar as unknown as SugarInner<T>;
    return sugarInner.template?.status === 'pending';
  });

  useEffect(() => {
    const updatePendingState = () => {
      const sugarInner = sugar as unknown as SugarInner<T>;
      const newIsPending = sugarInner.template?.status === 'pending';
      setIsPending(newIsPending);
    };

    sugar.addEventListener('templateChange', updatePendingState);

    return () => {
      sugar.removeEventListener('templateChange', updatePendingState);
    };
  }, [sugar]);

  return isPending;
}
