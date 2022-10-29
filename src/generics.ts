export type GenericMutable<T> = {
  -readonly [P in keyof T]: T[any];
};
