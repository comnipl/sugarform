export type SugarValue = any;

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

export type SugarGetter<T extends SugarValue> = () => Promise<SugarGetResult<T>>;
export type SugarSetter<T extends SugarValue> = (value: T) => Promise<SugarSetResult<T>>;
