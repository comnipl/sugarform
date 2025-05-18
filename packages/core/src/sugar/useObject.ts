import { useEffect, useRef } from 'react';
import {
  Sugar,
  SugarGetResult,
  SugarSetResult,
  SugarUseObjectResult,
  SugarValueObject,
} from './types';
import { SugarInner } from '.';

export function useObject<T extends SugarValueObject>(
  sugar: Sugar<T>
): SugarUseObjectResult<T> {
  const sugars = useRef<Map<string, Sugar<unknown>>>();

  // sugars内の値を初期化する。 (空のsugarで埋める)
  if (!sugars.current) {
    sugars.current = new Map();
    const template = (sugar as SugarInner<T>).template;
    for (const key in template) {
      sugars.current.set(key, new SugarInner(template[key]) as Sugar<unknown>);
    }
  }

  useEffect(() => {
    sugar.ready(
      async () => {
        if (!matchSugars(sugar, sugars.current)) {
          console.error(
            'The keys of the sugar template and map do not match. This is probably a problem on the SugarForm side, so please report it.'
          );
          sugar.destroy();
          return { result: 'unavailable' };
        }

        // TODO: 一定期間でタイムアウトして、コンポーネントがないと警告を出すと開発者体験がより良い。

        // すべてのsugarのgetterを実行する。
        const values: [string, SugarGetResult<unknown>][] = await Promise.all(
          [...sugars.current.entries()].map(async ([key, value]) => {
            const result = await value.get();
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
        if (!matchSugars(sugar, sugars.current)) {
          console.error(
            'The keys of the sugar template and map do not match. This is probably a problem on the SugarForm side, so please report it.'
          );
          sugar.destroy();
          return { result: 'unavailable' };
        }

        // すべてのsugarのsetterを実行する。
        const results: [string, SugarSetResult<unknown>][] = await Promise.all(
          [...sugars.current.entries()].map(async ([key, s]) => {
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
      }
    );

    // アンマウント時にsugarの状態をunavailableにする。
    return () => {
      sugar.destroy();
    };
  }, [sugar]);

  return {
    fields: Object.fromEntries(
      sugars.current.entries()
    ) as SugarUseObjectResult<T>['fields'],
  };
}

/**
 * mapの中に、sugarのtemplateと同じkeyがあるかどうかを確認する。
 */
function matchSugars<T extends SugarValueObject>(
  sugar: Sugar<T>,
  map: Map<string, Sugar<unknown>> | undefined
): map is Map<string, Sugar<unknown>> {
  if (map === undefined) {
    return false;
  }

  const templateKeys = new Set(Object.keys((sugar as SugarInner<T>).template));
  const mapKeys = new Set(map.keys());

  return templateKeys.isSubsetOf(mapKeys) && mapKeys.isSubsetOf(templateKeys);
}
