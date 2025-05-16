import { SugarGetResult, SugarGetter, SugarSetResult, SugarSetter, SugarValue } from './types';

export class Sugar<T extends SugarValue> {

  // Sugarは、get/setができるようになるまでに、Reactのレンダリングを待つ必要があります。
  // そのあいだに、get/setが呼びだされた場合、状態がReadyになるまで待機して実行します。
  private status: {
    status: 'unready',

    // unreadyな状態でgetが呼びだされた場合に返却されるPromise。
    getPromise: ReturnType<SugarGetter<T>>,

    // `getPromise`を解決する関数。readyすると直ちに呼び出される。
    resolveGetPromise: (value: SugarGetResult<T>) => void,

    // unreadyな状態でsetが呼びだされた場合に返却されるPromise。
    setPromise: ReturnType<SugarSetter<T>>,

    // `setPromise`を解決する関数。readyすると直ちに呼び出される。
    resolveSetPromise: (value: SugarSetResult<T>) => void,

    // unreadyな状態で呼び出された最新のsetの値。
    recentValue: T | null,

    // ready() の処理はasyncで実行されるため、ready()の処理中にstatusに触らないようにする。
    lock: boolean,

  } | {
    status: 'ready',
    getter: SugarGetter<T>,
    setter: SugarSetter<T>,
  } | {
    status: 'unavailable',
  };


  template: T;

  constructor(template: T) {
    const { promise: getPromise, resolve: resolveGetPromise } = Promise.withResolvers<SugarGetResult<T>>();
    const { promise: setPromise, resolve: resolveSetPromise } = Promise.withResolvers<SugarSetResult<T>>();

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

  get(): Promise<SugarGetResult<T>> {
    switch (this.status.status) {
      case 'unavailable':
        return Promise.resolve( {
          result: 'unavailable',
        } );
      case 'unready':
        return this.status.getPromise;
      case 'ready':
        return this.status.getter();
    }
  }

  set(value: T): Promise<SugarSetResult<T>> {
    switch (this.status.status) {
      case 'unavailable':
        return Promise.resolve( {
          result: 'unavailable',
        } );
      case 'unready':
        this.status.recentValue = value;
        return this.status.setPromise;
      case 'ready':
        return this.status.setter(value);
    }
  }

  async ready(getter: SugarGetter<T>, setter: SugarSetter<T>) {
    if (this.status.status === 'unready') {
      // ready() の処理はasyncで実行されるため、ready()の処理中にstatusに触らないようにする。
      if (this.status.lock) {
        return;
      }
      this.status.lock = true;

      this.status.resolveGetPromise(await getter());
      if (this.status.recentValue !== null) {
        console.log('setter', this.status.recentValue);
        this.status.resolveSetPromise(await setter(this.status.recentValue));
      }
    }

    this.status = {
      status: 'ready',
      getter,
      setter,
    };
  }
}
