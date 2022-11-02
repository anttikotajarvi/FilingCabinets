'use strict';
/*

NOTES
~: afterthought
?: unsolved
!: critical

*/

import fs = require('fs');
import {
  GenericMutable,
  memoize,
  DeepReadonly,
} from './generics';
import Ajv, {
  JTDDataType,
  JTDSchemaType,
  Schema,
  ValidateFunction,
} from 'ajv/dist/jtd';
import { json } from 'stream/consumers';
const ajv = new Ajv();
const memoizedAjvCompile = memoize<ValidateFunction<any>>(
  ajv.compile,
);

/*  Types   */

type PredicateFunction<T> = (x: T) => boolean;
type PredicateObject<T> = {
  function: PredicateFunction<T>;
  hotfix: (x: T) => T;
};

export type BinderDefinition = {
  predicates: (
    | PredicateFunction<File>
    | PredicateObject<File>
  )[];
};
export type FolderDefinition<X> = {
  JTDSchema: JTDSchemaType<X>;
  predicates?: (
    | PredicateFunction<X>
    | PredicateObject<X>
  )[];
};
export type CabinetDefinition = {
  readonly name: string;
  readonly definitions: {
    [key: string]: FolderDefinition<any> | BinderDefinition;
  };
};

export type DocumentReference<BaseType> = {
  readonly id: string;
  readonly exists: boolean;
  readonly makeCopy: () => BaseType | null;
  readonly update: (newData: BaseType) => void;
};

export type BinderReference = {
  readonly name: string;
  readonly file: (docData: File) => void;
};

export type FolderReference<BaseType> = {
  readonly name: string;
  readonly JTDSchema: JTDSchemaType<BaseType>;
  readonly file: (
    docData: BaseType,
  ) => DocumentReference<BaseType>;
  readonly doc: (
    id: string,
  ) => DocumentReference<BaseType> | null;
};

export type CabinetReference = {
  readonly name: string;
  readonly folder: (
    folderName: string,
  ) => FolderReference<any>;
};

function CreateDocumentReference<BaseType>(
  cabinetDefinition: CabinetDefinition,
  folderName: string,
  documentID: string,
): DocumentReference<BaseType> {
  const folderDefinition = cabinetDefinition.definitions[
    folderName
  ] as FolderDefinition<BaseType>;
  const filepath = DocPath(
    cabinetDefinition.name,
    folderName,
    documentID,
  );

  return {
    id: documentID,
    exists: fs.existsSync(filepath),
    makeCopy: (): BaseType | null => {
      if (!fs.existsSync(filepath))
        SHITBED('doc_doesnt_exist');

      return ReadDocData(filepath);
    },
    update: (newData: BaseType): void => {
      if (!fs.existsSync(filepath))
        SHITBED('doc_doesnt_exist');

      const validate = memoizedAjvCompile(
        folderDefinition.JTDSchema,
      );
      if (!validate(newData)) SHITBED('invalid_doc_data');

      WriteDocData<BaseType>(
        DocPath(
          cabinetDefinition.name,
          folderName,
          documentID,
        ),
        newData,
      );

      return;
    },
  };
}

function CreateFolderReference<BaseType>(
  cabinetDefinition: CabinetDefinition,
  folderName: string,
): FolderReference<BaseType> {
  const folderDefinition = cabinetDefinition.definitions[
    folderName
  ] as FolderDefinition<BaseType>;

  return {
    name: folderName,
    JTDSchema: folderDefinition.JTDSchema,
    file: (
      newData: BaseType,
    ): DocumentReference<BaseType> => {
      // Compile JTD
      // ?NOTE: not sure if compilation can fail without a type error
      const validate = ajv.compile<BaseType>(
        folderDefinition.JTDSchema,
      );

      // Validate data
      if (!validate(newData)) SHITBED('invalid_doc_data');

      const finalData = CheckPredicates<BaseType>(
        folderDefinition.predicates,
        newData,
      );

      const reservedID = ValidID();

      WriteDocData<BaseType>(
        DocPath(
          cabinetDefinition.name,
          folderName,
          reservedID,
        ),
        finalData,
      );

      return CreateDocumentReference<BaseType>(
        cabinetDefinition,
        folderName,
        reservedID,
      );
    },

    doc: (id: string): DocumentReference<BaseType> => {
      // huh, not much to this one
      return CreateDocumentReference<BaseType>(
        cabinetDefinition,
        folderName,
        id,
      );
    },
  };
}

function CreateCabinetReference(
  cabinetDefinition: CabinetDefinition,
): CabinetReference {
  const keys = Object.keys(cabinetDefinition.definitions);
  const [folderKeys, binderKeys] = folderAndBinderKeys(
    cabinetDefinition,
  );

  return {
    name: cabinetDefinition.name,
    folder: (folderName: string): FolderReference<any> => {
      if (!folderKeys.includes(folderName))
        binderKeys.includes(folderName)
          ? SHITBED('folder_addressed_as_binder')
          : SHITBED('folder_not_found');

      const folderDefinition = cabinetDefinition
        .definitions[folderName] as FolderDefinition<any>;

      type BaseType = JTDDataType<
        typeof folderDefinition.JTDSchema
      >;

      return CreateFolderReference<BaseType>(
        cabinetDefinition,
        folderName,
      );
    },
  };
}
/************************************************************/

/*  Module state    */
const DEFAULTS = JSON.parse(
  fs.readFileSync('../defaults.json', 'utf-8'),
);

type STATE = {
  readonly INITIALIZED: boolean;
  readonly CONFIG: object;
  readonly CABINETS: {
    [key: string]: CabinetDefinition;
  };
  readonly CACHED: {
    validateFunctions: {
      [key: string]: ValidateFunction<any>;
    };
  };
};

const INITIAL: STATE = {
  INITIALIZED: false,
  CONFIG: Object(),
  CABINETS: Object(),
  CACHED: {
    validateFunctions: {},
  },
};

let CURRENT: STATE = INITIAL;
/************************************************************/

/*  Local functions */
const getConfig = (): object =>
  JSON.parse(
    fs.readFileSync(
      DEFAULTS.PROJECT_ROOT + 'filcabsconfig.json',
      'utf-8',
    ),
  );
const isBinder = (
  definition: FolderDefinition<any> | BinderDefinition,
) =>
  (definition as FolderDefinition<any>).JTDSchema ===
  undefined;

// Sort folder and binder definition keys
// ~NOTE: kind of a stupid function
const folderAndBinderKeys = (
  cabinet: CabinetDefinition,
): [string[], string[]] => {
  const keys = Object.keys(cabinet.definitions);
  const folderKeys = Array();
  const binderKeys = Array();
  keys.map((key: string) =>
    isBinder(cabinet.definitions[key])
      ? binderKeys.push(key)
      : folderKeys.push(key),
  );

  return [folderKeys, binderKeys];
};

/************************************************************/
function SHITBED(
  error_code: string,
  dump_data: any = {},
): void {
  throw Error(
    'BED = SHAT \n' +
      error_code +
      '\n DATA: \n' +
      JSON.stringify(dump_data, undefined, 2),
  );
}

function DocPath(
  cabinetName: string,
  containerName: string,
  documentID: string,
) {
  return `../.storage/${cabinetName}/${containerName}/${documentID}`;
}

function WriteDocData<BaseType>(
  filepath: string,
  data: BaseType,
): void {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data));
  } catch (error) {
    SHITBED('doc_write_failed');
  }
}
function ReadDocData<BaseType>(
  filepath: string,
): BaseType | null {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (error) {
    SHITBED('doc_read_failed');
  }
  return null;
}

function CheckPredicates<T>(
  predicates:
    | (PredicateFunction<T> | PredicateObject<T>)[]
    | undefined,
  data: T,
): T {
  if (typeof predicates === 'undefined') return data;

  let tempData = data;
  predicates.map(
    (
      P: PredicateFunction<T> | PredicateObject<T>,
      i: number,
    ) => {
      if (typeof P === 'function') {
        if (!P(tempData))
          SHITBED('predcate_false', { predicate: P });
      } else {
        if (!P.function(tempData)) {
          tempData = P.hotfix(tempData);
          if (!P.function(tempData))
            SHITBED('predicate_false_after_hotfix', {
              predicate: P,
            });
        }
      }
    },
  );

  return tempData;
}
function ValidID(): string {
  return Date.now().toString();
}

/* Control */
export const FilingCabinets = {
  use: (
    cabinetDefinition: CabinetDefinition,
  ): CabinetReference => {
    return CreateCabinetReference(cabinetDefinition);
  },
};
