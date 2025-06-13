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
    const checkPendingState = () => {
      const sugarInner = sugar as unknown as SugarInner<T>;
      const newIsPending = sugarInner.template?.status === 'pending';
      setIsPending(newIsPending);
    };

    checkPendingState();

    const originalSetTemplate = sugar.setTemplate.bind(sugar);
    sugar.setTemplate = async (value: T, executeSet = true) => {
      const result = await originalSetTemplate(value, executeSet);
      checkPendingState();
      return result;
    };

    const sugarInner = sugar as unknown as SugarInner<T>;
    const originalSetPendingTemplate =
      sugarInner.setPendingTemplate?.bind(sugarInner);
    if (originalSetPendingTemplate) {
      sugarInner.setPendingTemplate = () => {
        originalSetPendingTemplate();
        checkPendingState();
      };
    }

    return () => {
      sugar.setTemplate = originalSetTemplate;
      if (originalSetPendingTemplate) {
        sugarInner.setPendingTemplate = originalSetPendingTemplate;
      }
    };
  }, [sugar]);

  return isPending;
}
