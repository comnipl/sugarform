export type SugarValue = unknown;
export type SugarValueObject = SugarValue & Record<string, SugarValue>;

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

import type { DependencyList } from 'react';

export type ValidationStage = 'input' | 'blur' | 'submit';
export type FailFn<V> = (value: V, stage?: ValidationStage) => void;

export type SugarGetter<T extends SugarValue> = (
  stage?: ValidationStage
) => Promise<SugarGetResult<T>>;
export type SugarSetter<T extends SugarValue> = (
  value: T
) => Promise<SugarSetResult<T>>;

export type SugarUseObjectResult<T extends SugarValueObject> = {
  fields: {
    [K in keyof T]: Sugar<T[K]>;
  };
};

export type SugarUseObject<T extends SugarValue> = T extends SugarValueObject
  ? () => SugarUseObjectResult<T>
  : never;

export type SugarUseValidation<T extends SugarValue> = <V>(
  validator: (value: T, fail: FailFn<V>) => void | Promise<void>,
  deps?: DependencyList
) => V[];

type SugarType<T extends SugarValue> = {
  get: SugarGetter<T>;
  set: SugarSetter<T>;
  ready: (getter: SugarGetter<T>, setter: SugarSetter<T>) => Promise<void>;
  destroy: () => void;
  useObject: SugarUseObject<T>;
  useValidation: SugarUseValidation<T>;
  addEventListener: <K extends keyof SugarEvent<T>>(
    type: K,
    listener: CustomEventListener<SugarEvent<T>[K]>
  ) => void;
  removeEventListener: <K extends keyof SugarEvent<T>>(
    type: K,
    listener: CustomEventListener<SugarEvent<T>[K]>
  ) => void;
  dispatchEvent: <K extends keyof SugarEvent<T>>(
    type: K,
    detail?: SugarEvent<T>[K]
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

export type SugarEvent<_T extends SugarValue> = {
  change: undefined;
  blur: undefined;
  submit: undefined;
};
