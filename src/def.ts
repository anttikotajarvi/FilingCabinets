import {
  GenericMutable,
  memoize,
  DeepReadonly
} from './generics';
import Ajv, {
  JTDDataType,
  JTDSchemaType,
  Schema,
  ValidateFunction
} from 'ajv/dist/jtd';

// Cabinet
export interface CabinetDefinition {
  readonly name: string;
  readonly definitions: {
    [key: string]: FolderDefinition<any> | BinderDefinition;
  };
}
export type CabinetReference = {
  readonly name: string;
  readonly folder: (
    folderName: string
  ) => FolderReference<any>;
  readonly binder: (binderName: string) => BinderReference;
  readonly delete: () => void;
};

// Folder
export interface FolderDefinition<X>
  extends ContainerDefinition<X> {
  JTDSchema: JTDSchemaType<X>;
}
export type FolderReference<BaseType> = {
  readonly name: string;
  readonly JTDSchema: JTDSchemaType<BaseType>;
  readonly file: (
    docData: BaseType
  ) => DocumentReference<BaseType>;
  readonly doc: (id: string) => DocumentReference<BaseType>;
};
export type DocumentReference<BaseType> = {
  readonly id: string;
  readonly exists: boolean;
  readonly makeCopy: () => BaseType | null;
  readonly delete: () => void;
  readonly update: (newData: BaseType) => void;
};

// Binder
export interface BinderDefinition
  extends ContainerDefinition<BinderFile> {
  // eh
}
export type BinderReference = {
  readonly name: string;
  readonly file: (
    binderFile: BinderFile
  ) => BinderFileReference;
  readonly doc: (filename: string) => BinderFileReference;
};
export type BinderFileReference = {
  readonly filename: string;
  readonly exists: boolean;
  readonly makeCopy: () => BinderFile;
  readonly delete: () => void;
};
export type BinderFile = {
  readonly filename: string;
  readonly buffer: Buffer;
};

//
export type PredicateFunction<T> = (x: T) => boolean;
export type PredicateObject<T> = {
  function: PredicateFunction<T>;
  hotfix: (x: T) => T;
};
export interface ContainerDefinition<X> {
  description?: 'string';
  predicates?: (
    | PredicateFunction<X>
    | PredicateObject<X>
  )[];
}
