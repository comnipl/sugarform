import {
  CustomEventListener,
  Sugar,
  SugarEvent,
  SugarGetResult,
  SugarGetter,
  SugarSetResult,
  SugarSetter,
  SugarTemplateSetter,
  SugarTemplateState,
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
import { useTransform, SugarUseTransform } from './useTransform';
import { useIsPending, SugarUseIsPending } from './useIsPending';

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

        // unreadyな状態でsetTemplateが呼びだされた場合に返却されるPromise。
        setTemplatePromise: ReturnType<SugarTemplateSetter<T>>;

        // `setTemplatePromise`を解決する関数。readyすると直ちに呼び出される。
        resolveSetTemplatePromise: (value: SugarSetResult<T>) => void;

        // unreadyな状態で呼び出された最新のsetの値。
        recentValue: T | null;

        // unreadyな状態で呼び出された最新のsetTemplateの値とexecuteSetフラグ。
        recentTemplateValue: T | null;
        recentTemplateExecuteSet: boolean;

        // ready() の処理はasyncで実行されるため、ready()の処理中にstatusに触らないようにする。
        lock: boolean;
      }
    | {
        status: 'ready';
        getter: SugarGetter<T>;
        setter: SugarSetter<T>;
        templateSetter?: SugarTemplateSetter<T>;
      }
    | {
        status: 'unavailable';
      };

  template: SugarTemplateState<T>;
  private validators: Set<
    (stage: ValidationStage, value: T) => Promise<boolean>
  > = new Set();

  constructor(template?: SugarTemplateState<T>) {
    const { promise: getPromise, resolve: resolveGetPromise } =
      Promise.withResolvers<SugarGetResult<T>>();
    const { promise: setPromise, resolve: resolveSetPromise } =
      Promise.withResolvers<SugarSetResult<T>>();
    const { promise: setTemplatePromise, resolve: resolveSetTemplatePromise } =
      Promise.withResolvers<SugarSetResult<T>>();

    this.status = {
      status: 'unready',
      getPromise,
      resolveGetPromise,
      setPromise,
      resolveSetPromise,
      setTemplatePromise,
      resolveSetTemplatePromise,
      recentValue: null,
      recentTemplateValue: null,
      recentTemplateExecuteSet: true,
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
    this.template = { status: 'resolved', value };

    switch (this.status.status) {
      case 'unavailable':
        return Promise.resolve({
          result: 'unavailable',
        });
      case 'unready':
        this.status.recentTemplateValue = value;
        this.status.recentTemplateExecuteSet = executeSet;
        return this.status.setTemplatePromise;
      case 'ready':
        if (this.status.templateSetter) {
          return this.status.templateSetter(value, executeSet);
        } else {
          if (executeSet) {
            return this.set(value);
          } else {
            return Promise.resolve({
              result: 'success',
            });
          }
        }
    }
  }

  setPendingTemplate(): void {
    this.template = { status: 'pending' };
    if (this.status.status === 'ready' && this.status.templateSetter) {
      this.status.templateSetter(undefined as T, false);
    }
  }

  private getTemplateValue(): T | undefined {
    if (this.template?.status === 'resolved') {
      return this.template.value;
    }
    return undefined;
  }

  private eventTarget: EventTarget = new EventTarget();

  addEventListener<K extends keyof SugarEvent>(
    type: K,
    listener: CustomEventListener<SugarEvent[K]>
  ) {
    this.eventTarget.addEventListener(type, listener as EventListener);
  }

  removeEventListener<K extends keyof SugarEvent>(
    type: K,
    listener: CustomEventListener<SugarEvent[K]>
  ) {
    this.eventTarget.removeEventListener(type, listener as EventListener);
  }

  dispatchEvent<K extends keyof SugarEvent>(type: K, detail?: SugarEvent[K]) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  async ready(
    getter: SugarGetter<T>,
    setter: SugarSetter<T>,
    templateSetter?: SugarTemplateSetter<T>
  ) {
    if (this.status.status === 'unready') {
      // ready() の処理はasyncで実行されるため、ready()の処理中にstatusに触らないようにする。
      if (this.status.lock) {
        return;
      }
      const status = this.status;
      status.lock = true;

      const initial = status.recentValue ?? this.getTemplateValue();
      if (initial !== undefined) {
        status.resolveSetPromise(await setter(initial));
      }
      status.resolveGetPromise(await getter(false));

      if (status.recentTemplateValue !== null) {
        const templateResult = templateSetter
          ? await templateSetter(
              status.recentTemplateValue,
              status.recentTemplateExecuteSet
            )
          : status.recentTemplateExecuteSet
            ? await setter(status.recentTemplateValue)
            : { result: 'success' as const };
        status.resolveSetTemplatePromise(templateResult);
      } else {
        status.resolveSetTemplatePromise({ result: 'success' });
      }
    }

    this.status = {
      status: 'ready',
      getter,
      setter,
      templateSetter,
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
          this.status.resolveSetTemplatePromise({ result: 'unavailable' });
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

  useTransform: SugarUseTransform<T> = (<U extends SugarValue>(config: {
    forward: (value: T) => Promise<U>;
    backward: (value: U) => Promise<T>;
  }) => useTransform(this as Sugar<T>, config)) as SugarUseTransform<T>;

  useIsPending: SugarUseIsPending = (() =>
    useIsPending(this as Sugar<T>)) as SugarUseIsPending;
}
