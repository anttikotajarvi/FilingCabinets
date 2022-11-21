import { CabinetDefinition } from './def';

export type GenericMutable<T> = {
  -readonly [P in keyof T]: T[any];
};

/*
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
*/

// bad memoize function
export const memoize = <T = any>(
  fn: (...args: any[]) => T
) => {
  const cache = Object();
  return (...args: any[]): T => {
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

/**
 * @author Michael Wallace
 * @url https://stackoverflow.com/a/59422590
 */
export function anyToString(
  valueToConvert: unknown
): string {
  if (
    valueToConvert === undefined ||
    valueToConvert === null
  ) {
    return valueToConvert === undefined
      ? 'undefined'
      : 'null';
  }
  if (typeof valueToConvert === 'string') {
    return `'${valueToConvert}'`;
  }
  if (
    typeof valueToConvert === 'number' ||
    typeof valueToConvert === 'boolean' ||
    typeof valueToConvert === 'function'
  ) {
    return valueToConvert.toString();
  }
  if (valueToConvert instanceof Array) {
    const stringfiedArray = valueToConvert
      .map((property) => anyToString(property))
      .join(',');
    return `[${stringfiedArray}]`;
  }
  if (typeof valueToConvert === 'object') {
    const stringfiedObject = Object.entries(valueToConvert)
      .map((entry: [string, unknown]) => {
        return `${entry[0]}: ${anyToString(entry[1])}`;
      })
      .join(',');
    return `{${stringfiedObject}}`;
  }
  return JSON.stringify(valueToConvert);
}


export function findClosest(set:unknown[], num:number) {
  const _set = (i:number) => Number(set[i])

  if(num < _set(0)) return 0;
  if(num > _set(set.length - 1)) return set.length -1 

  let step = set.length / 2;
  const f = (ptr:number):number => {
      const down = Math.floor(ptr)
      const up = down + 1
      step /= 2;
 
      if(num < _set(down)) 
          return f(ptr-step)
      
      if(num > _set(up)) 
          return f(ptr+step);
      
      if(num - _set(down) < _set(up) - num)
          return down
      else
          return up
  }
  return f(set.length * 0.5)
}

