import {
  CustomEventListener,
  Sugar,
  SugarEvent,
  SugarGetResult,
  SugarGetter,
  SugarSetResult,
  SugarSetter,
  SugarValue,
  SugarValueObject,
} from './types';
import { useObject, SugarUseObject } from './useObject';
import {
  useValidation,
  SugarUseValidation,
  ValidationStage,
  FailFn,
} from './useValidation';

export class SugarInner<T extends SugarValue> {
  // Sugarは、get/setができるようになるまでに、Reactのレンダリングを待つ必要があります。
  // そのあいだに、get/setが呼びだされた場合、状態がReadyになるまで待機して実行します。
  private status:
    | {
        status: 'unready';

        // unreadyな状態でgetが呼びだされた場合に返却されるPromise。
        getPromise: ReturnType<SugarGetter<T>>;

        // `getPromise`を解決する関数。readyすると直ちに呼び出される。
        resolveGetPromise: (value: SugarGetResult<T>) => void;

        // unreadyな状態でsetが呼びだされた場合に返却されるPromise。
        setPromise: ReturnType<SugarSetter<T>>;

        // `setPromise`を解決する関数。readyすると直ちに呼び出される。
        resolveSetPromise: (value: SugarSetResult<T>) => void;

        // unreadyな状態で呼び出された最新のsetの値。
        recentValue: T | null;

        // ready() の処理はasyncで実行されるため、ready()の処理中にstatusに触らないようにする。
        lock: boolean;
      }
    | {
        status: 'ready';
        getter: SugarGetter<T>;
        setter: SugarSetter<T>;
      }
    | {
        status: 'unavailable';
      };

  template: T;
  private validators: Set<
    (stage: ValidationStage, value: T) => Promise<boolean>
  > = new Set();

  constructor(template: T) {
    const { promise: getPromise, resolve: resolveGetPromise } =
      Promise.withResolvers<SugarGetResult<T>>();
    const { promise: setPromise, resolve: resolveSetPromise } =
      Promise.withResolvers<SugarSetResult<T>>();

    this.status = {
      status: 'unready',
      getPromise,
      resolveGetPromise,
      setPromise,
      resolveSetPromise,
      recentValue: null,
      lock: false,
    };

    this.template = template;
  }

  registerValidator(
    fn: (stage: ValidationStage, value: T) => Promise<boolean>
  ) {
    this.validators.add(fn);
  }

  unregisterValidator(
    fn: (stage: ValidationStage, value: T) => Promise<boolean>
  ) {
    this.validators.delete(fn);
  }

  private async runValidators(stage: ValidationStage, value: T) {
    if (this.validators.size === 0) return true;
    const results = await Promise.all(
      [...this.validators].map((v) => v(stage, value))
    );
    return results.every((r) => r);
  }

  async getInternal(
    stage: ValidationStage = 'input'
  ): Promise<SugarGetResult<T>> {
    switch (this.status.status) {
      case 'unavailable':
        return { result: 'unavailable' };
      case 'unready':
        return this.status.getPromise;
      case 'ready':
        return this.status.getter(stage === 'submit');
    }
  }

  async get(submit = false): Promise<SugarGetResult<T>> {
    const stage: ValidationStage = submit ? 'submit' : 'input';
    const result = await this.getInternal(stage);
    if (result.result !== 'success') {
      return result;
    }

    const ok = await this.runValidators(stage, result.value);
    if (!ok) {
      return { result: 'validation_fault' };
    }
    return result;
  }

  set(value: T): Promise<SugarSetResult<T>> {
    switch (this.status.status) {
      case 'unavailable':
        return Promise.resolve({
          result: 'unavailable',
        });
      case 'unready':
        this.status.recentValue = value;
        return this.status.setPromise;
      case 'ready':
        return this.status.setter(value);
    }
  }

  setTemplate(value: T, executeSet = true): Promise<SugarSetResult<T>> {
    this.template = value;
    this.dispatchEvent('templateChange', value);

    if (executeSet) {
      return this.set(value);
    } else {
      return Promise.resolve({
        result: 'success',
      });
    }
  }

  private eventTarget: EventTarget = new EventTarget();

  addEventListener<K extends keyof SugarEvent<T>>(
    type: K,
    listener: CustomEventListener<SugarEvent<T>[K]>
  ) {
    this.eventTarget.addEventListener(type, listener as EventListener);
  }

  removeEventListener<K extends keyof SugarEvent<T>>(
    type: K,
    listener: CustomEventListener<SugarEvent<T>[K]>
  ) {
    this.eventTarget.removeEventListener(type, listener as EventListener);
  }

  dispatchEvent<K extends keyof SugarEvent<T>>(
    type: K,
    detail?: SugarEvent<T>[K]
  ) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  async ready(getter: SugarGetter<T>, setter: SugarSetter<T>) {
    if (this.status.status === 'unready') {
      // ready() の処理はasyncで実行されるため、ready()の処理中にstatusに触らないようにする。
      if (this.status.lock) {
        return;
      }
      const status = this.status;
      status.lock = true;

      status.resolveSetPromise(
        await setter(status.recentValue ?? this.template)
      );
      status.resolveGetPromise(await getter(false));
    }

    this.status = {
      status: 'ready',
      getter,
      setter,
    };
  }

  destroy() {
    switch (this.status.status) {
      case 'ready':
        this.status = {
          status: 'unavailable',
        };
        break;
      case 'unready':
        if (!this.status.lock) {
          this.status.resolveGetPromise({ result: 'unavailable' });
          this.status.resolveSetPromise({ result: 'unavailable' });
        }
        this.status = {
          status: 'unavailable',
        };
        break;
      case 'unavailable':
        break;
    }
  }

  useObject: SugarUseObject<T> = (() =>
    useObject(this as Sugar<SugarValueObject>)) as SugarUseObject<T>;

  useValidation: SugarUseValidation<T> = (<V>(
    validator: (value: T, fail: FailFn<V>) => void | Promise<void>,
    deps?: React.DependencyList
  ) =>
    useValidation(this as Sugar<T>, validator, deps)) as SugarUseValidation<T>;
}
