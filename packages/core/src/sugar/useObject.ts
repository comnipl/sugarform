import { useEffect, useRef } from 'react';
import {
  Sugar,
  SugarGetResult,
  SugarSetResult,
  SugarTemplateState,
  SugarValue,
  SugarValueObject,
} from './types';
import { SugarInner } from '.';

export type SugarUseObjectResult<T extends SugarValueObject> = {
  fields: {
    [K in keyof T]: Sugar<T[K]>;
  };
};

export type SugarUseObject<T extends SugarValue> = T extends SugarValueObject
  ? () => SugarUseObjectResult<T>
  : never;

export function useObject<T extends SugarValueObject>(
  sugar: Sugar<T>
): SugarUseObjectResult<T> {
  const fields = useRef<SugarUseObjectResult<T>['fields']>(undefined);
  const sugarInitializer = useRef<
    {
      dispatchChange: () => void;
      dispatchBlur: () => void;
    }[]
  >([]);

  // sugars内の値を初期化する。 (空のsugarで埋める)
  if (!fields.current) {
    fields.current = new Proxy(
      {},
      {
        get: (target: Record<string, SugarInner<unknown>>, prop: string, _) => {
          if (!(prop in target)) {
            const parentTemplate = (sugar as SugarInner<T>).template;
            let childTemplate: SugarTemplateState<unknown>;

            if (parentTemplate?.status === 'pending') {
              childTemplate = { status: 'pending' };
            } else if (parentTemplate?.status === 'resolved') {
              const parentValue = parentTemplate.value as Record<
                string,
                unknown
              >;
              if (
                parentValue &&
                typeof parentValue === 'object' &&
                prop in parentValue
              ) {
                childTemplate = {
                  status: 'resolved',
                  value: parentValue[prop],
                };
              } else {
                childTemplate = undefined;
              }
            } else {
              childTemplate = undefined;
            }

            const s = new SugarInner(childTemplate);
            sugarInitializer.current.forEach((initializer) => {
              s.addEventListener('change', initializer.dispatchChange);
              s.addEventListener('blur', initializer.dispatchBlur);
            });
            target[prop] = s;
          }
          return target[prop];
        },
      }
    ) as SugarUseObjectResult<T>['fields'];
  }

  useEffect(() => {
    // イベントを接続
    const dispatchChange = () => sugar.dispatchEvent('change');
    const dispatchBlur = () => sugar.dispatchEvent('blur');

    const initializer = {
      dispatchChange,
      dispatchBlur,
    };

    Object.values(fields.current!).forEach((sugar) => {
      sugar.addEventListener('change', dispatchChange);
      sugar.addEventListener('blur', dispatchBlur);
    });

    sugarInitializer.current.push(initializer);

    sugar.ready(
      async (submit) => {
        // if (!matchSugars(sugar, fields.current)) {
        //   console.error(
        //     'The keys of the sugar template and map do not match. This is probably a problem on the SugarForm side, so please report it.'
        //   );
        //   sugar.destroy();
        //   return { result: 'unavailable' };
        // }

        // TODO: 一定期間でタイムアウトして、コンポーネントがないと警告を出すと開発者体験がより良い。

        // すべてのsugarのgetterを実行する。
        const values: [string, SugarGetResult<unknown>][] = await Promise.all(
          Object.entries(fields.current!).map(async ([key, value]) => {
            const result = await value.get(submit);
            return [key, result];
          })
        );

        // ひとつでも`unavailable`があれば、警告を出して`unavailable`を返す。
        const unavailables = values.filter(
          ([_, value]) => value.result === 'unavailable'
        );
        if (unavailables.length > 0) {
          console.error(
            `Getting useObject sugar: ${unavailables
              .map(([key, _]) => key)
              .join(', ')} is unavailable.`
          );
          return { result: 'unavailable' };
        }

        // ひとつでも `validation_fault`があれば、`validation_fault`を返す。
        if (values.some(([_, value]) => value.result === 'validation_fault')) {
          return { result: 'validation_fault' };
        }

        return {
          result: 'success',
          // `unavailable`や`validation_fault`が存在しないので、すべてのSugarは必ず`success`。
          value: Object.fromEntries(
            values.map(([key, value]) => [
              key,
              (value as SugarGetResult<unknown> & { result: 'success' }).value,
            ])
          ) as T,
        };
      },
      async (value) => {
        // if (!matchSugars(sugar, fields.current)) {
        //   console.error(
        //     'The keys of the sugar template and map do not match. This is probably a problem on the SugarForm side, so please report it.'
        //   );
        //   sugar.destroy();
        //   return { result: 'unavailable' };
        // }

        // すべてのsugarのsetterを実行する。
        const results: [string, SugarSetResult<unknown>][] = await Promise.all(
          Object.entries(fields.current!).map(async ([key, s]) => {
            const result = await s.set(value[key]);
            return [key, result];
          })
        );

        // ひとつでも`unavailable`があれば、警告を出して`unavailable`を返す。
        const unavailables = results.filter(
          ([_, value]) => value.result === 'unavailable'
        );
        if (unavailables.length > 0) {
          console.error(
            `Setting useObject sugar: ${unavailables
              .map(([key, _]) => key)
              .join(', ')} is unavailable.`
          );
          return { result: 'unavailable' };
        }

        return {
          result: 'success',
        };
      },
      async (value, executeSet = true) => {
        // if (!matchSugars(sugar, fields.current)) {
        //   console.error(
        //     'The keys of the sugar template and map do not match. This is probably a problem on the SugarForm side, so please report it.'
        //   );
        //   sugar.destroy();
        //   return { result: 'unavailable' };
        // }

        const parentTemplate = (sugar as SugarInner<T>).template;

        if (parentTemplate?.status === 'pending') {
          await Promise.all(
            Object.entries(fields.current!).map(async ([_, s]) => {
              (s as SugarInner<unknown>).setPendingTemplate();
            })
          );
          return { result: 'success' };
        } else if (parentTemplate?.status === 'resolved') {
          const parentValue = parentTemplate.value as Record<string, unknown>;
          const results: [string, SugarSetResult<unknown>][] =
            await Promise.all(
              Object.entries(fields.current!).map(async ([key, s]) => {
                if (
                  parentValue &&
                  typeof parentValue === 'object' &&
                  key in parentValue
                ) {
                  const result = await s.setTemplate(
                    parentValue[key],
                    executeSet
                  );
                  return [key, result];
                }
                return [key, { result: 'success' as const }];
              })
            );

          const unavailables = results.filter(
            ([_, value]) => value.result === 'unavailable'
          );
          if (unavailables.length > 0) {
            console.error(
              `Setting template for useObject sugar: ${unavailables
                .map(([key, _]) => key)
                .join(', ')} is unavailable.`
            );
            return { result: 'unavailable' };
          }

          return { result: 'success' };
        } else {
          const results: [string, SugarSetResult<unknown>][] =
            await Promise.all(
              Object.entries(fields.current!).map(async ([key, s]) => {
                const result = await s.setTemplate(
                  undefined as unknown,
                  executeSet
                );
                return [key, result];
              })
            );

          const unavailables = results.filter(
            ([_, value]) => value.result === 'unavailable'
          );
          if (unavailables.length > 0) {
            console.error(
              `Setting template for useObject sugar: ${unavailables
                .map(([key, _]) => key)
                .join(', ')} is unavailable.`
            );
            return { result: 'unavailable' };
          }

          return { result: 'success' };
        }
      }
    );

    // アンマウント時にsugarの状態をunavailableにする。
    return () => {
      sugar.destroy();
      if (fields.current) {
        Object.values(fields.current).forEach((sugar) => {
          sugar.removeEventListener('change', dispatchChange);
          sugar.removeEventListener('blur', dispatchBlur);
        });
        sugarInitializer.current = sugarInitializer.current.filter(
          (i) => i !== initializer
        );
      }
    };
  }, [sugar]);

  return {
    fields: fields.current,
  };
}

/**
 * mapの中に、sugarのtemplateと同じkeyがあるかどうかを確認する。
 */
// function matchSugars<T extends SugarValueObject>(
//   sugar: Sugar<T>,
//   map: Map<string, Sugar<unknown>> | undefined
// ): map is Map<string, Sugar<unknown>> {
//   if (map === undefined) {
//     return false;
//   }
//
//   const templateKeys = new Set(Object.keys((sugar as SugarInner<T>).template));
//   const mapKeys = new Set(map.keys());
//
//   return templateKeys.isSubsetOf(mapKeys) && mapKeys.isSubsetOf(templateKeys);
// }
