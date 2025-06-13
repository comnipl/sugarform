export type SugarValue = unknown;
export type SugarValueObject = SugarValue & Record<string, SugarValue>;

export type SugarTemplateState<T extends SugarValue> =
  | { status: 'pending' }
  | { status: 'resolved'; value: T }
  | undefined;

export type SugarGetResult<T extends SugarValue> =
  | {
      result: 'success';
      value: T;
    }
  | {
      result: 'validation_fault';
    }
  | {
      result: 'unavailable';
    };

export type SugarSetResult<_T extends SugarValue> =
  | {
      result: 'success';
    }
  | {
      result: 'unavailable';
    };

export type SugarGetter<T extends SugarValue> = (
  submit?: boolean
) => Promise<SugarGetResult<T>>;
export type SugarSetter<T extends SugarValue> = (
  value: T
) => Promise<SugarSetResult<T>>;
export type SugarTemplateSetter<T extends SugarValue> = (
  value: T,
  executeSet?: boolean
) => Promise<SugarSetResult<T>>;

import type { SugarUseObject } from './useObject';
import type { SugarUseValidation } from './useValidation';
<<<<<<< HEAD
import type { SugarUseTransform } from './useTransform';
||||||| 2096774
=======
import type { SugarUseIsPending } from './useIsPending';
>>>>>>> origin/main

type SugarType<T extends SugarValue> = {
  get: SugarGetter<T>;
  set: SugarSetter<T>;
  setTemplate: (value: T, executeSet?: boolean) => Promise<SugarSetResult<T>>;
  ready: (
    getter: SugarGetter<T>,
    setter: SugarSetter<T>,
    templateSetter?: SugarTemplateSetter<T>
  ) => Promise<void>;
  destroy: () => void;
  useObject: SugarUseObject<T>;
  useValidation: SugarUseValidation<T>;
<<<<<<< HEAD
  useTransform: SugarUseTransform<T>;
||||||| 2096774
=======
  useIsPending: SugarUseIsPending;
>>>>>>> origin/main
  addEventListener: <K extends keyof SugarEvent>(
    type: K,
    listener: CustomEventListener<SugarEvent[K]>
  ) => void;
  removeEventListener: <K extends keyof SugarEvent>(
    type: K,
    listener: CustomEventListener<SugarEvent[K]>
  ) => void;
  dispatchEvent: <K extends keyof SugarEvent>(
    type: K,
    detail?: SugarEvent[K]
  ) => void;
};

// useObjectなどの、Tが条件を満たしている場合のみに使えるメソッドを補完に表示させないように、
// never型のプロパティを削除する。
export type Sugar<T extends SugarValue> = {
  [K in keyof SugarType<T> as SugarType<T>[K] extends never
    ? never
    : K]: SugarType<T>[K];
};

export type CustomEventListener<T> = (evt: CustomEvent<T>) => void;

export type SugarEvent = {
  change: undefined;
  blur: undefined;
  submit: undefined;
};
