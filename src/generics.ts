export type GenericMutable<T> = {
  -readonly [P in keyof T]: T[any];
};

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

export interface DeepReadonlyArray<T>
  extends ReadonlyArray<DeepReadonly<T>> {}

export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export const memoize = <T = any>(
  fn: (...args: any[]) => T,
) => {
  const cache = Object();
  return (...args: any[]): any => {
    const argsHash = JSON.stringify(args);
    if (argsHash in cache) {
      return cache[argsHash];
    } else {
      const result = fn(...args);
      cache[argsHash] = result;
      return result;
    }
  };
};
