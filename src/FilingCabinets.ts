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
  DeepReadonly
} from './generics';
import Ajv, {
  JTDDataType,
  JTDSchemaType,
  Schema,
  ValidateFunction
} from 'ajv/dist/jtd';
const ajv = new Ajv();
const memoizedAjvCompile = memoize<ValidateFunction<any>>((schema: JTDSchemaType<any>) => {
  return ajv.compile(schema)
});

const CONFIG  = require('rc')("filingcabinets", {

  suppressPredicateErrors: false,
  relativeStoragePath: ".storage",

  port: 2468
});

// External file system access
const ext = {
  exists: (filepath: string): boolean => {
    return fs.existsSync(filepath);
  },

  writeDocData: <BaseType>(
    filepath: string,
    data: BaseType
  ): void => {
    try {
      fs.writeFileSync(filepath, JSON.stringify(data));
    } catch (error) {
      SHITBED('doc_write_failed', error);
    }
    return;
  },

  readDocData: <BaseType>(
    filepath: string
  ): BaseType | null => {
    try {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    } catch (error) {
      SHITBED('doc_read_failed');
    }
    return null;
  },

  buildCabinetTree: (
    cabinetDefinition: CabinetDefinition
  ): void => {
    const storageF = CONFIG.relativeStoragePath;
    const cabinetF =
      storageF + '/' + cabinetDefinition.name;

    const _mkdirSync = (p:string) => {
      if(!fs.existsSync(p)) fs.mkdirSync(p);
    }

    _mkdirSync(storageF);
    _mkdirSync(cabinetF);

    Object.keys(cabinetDefinition.definitions).map(
      (key: string) => {
        _mkdirSync(
          cabinetF + "/" +
          key
        );
      }
    );
  }
};

type PredicateFunction<T> = (x: T) => boolean;
type PredicateObject<T> = {
  function: PredicateFunction<T>;
  hotfix: (x: T) => T;
};
// Definitions
interface ContainerDefinition<X> {
  description?: "string";
  predicates?: (
    | PredicateFunction<X>
    | PredicateObject<X>
  )[];
}
let F = new File(["hello World!"], "hello_world.txt", {type:"text/plain"});

fs.writeFileSync("s","ss", {
  
})
let express = require("express");
let app = express();
app.post("/s", (req:any, res:any) => {

})
export interface BinderDefinition extends ContainerDefinition<File> {
  // eh
};

export interface FolderDefinition<X> extends ContainerDefinition<X>{
  JTDSchema: JTDSchemaType<X>;
};
export interface CabinetDefinition {
  readonly name: string;
  readonly definitions: {
    [key: string]: FolderDefinition<any> | BinderDefinition;
  };
};

// References
export type DocumentReference<BaseType> = {
  readonly id: string;
  readonly exists: boolean;
  readonly makeCopy: () => BaseType | null;
  readonly update: (newData: BaseType) => void;
};
export type FolderReference<BaseType> = {
  readonly name: string;
  readonly JTDSchema: JTDSchemaType<BaseType>;
  readonly file: (
    docData: BaseType
  ) => DocumentReference<BaseType>;
  readonly doc: (id: string) => DocumentReference<BaseType>;
};

export type BinderDocumentReference = {
  readonly filename: string,
  readonly delete: () => boolean
}
export type BinderReference = {
  readonly name: string;
  readonly file: (docData: File) => BinderDocumentReference;
};

export type CabinetReference = {
  readonly name: string;
  readonly folder: (
    folderName: string
  ) => FolderReference<any>;
};

// Reference build functions
function CreateDocumentReference<BaseType>(
  cabinetDefinition: CabinetDefinition,
  folderName: string,
  documentID: string
): DocumentReference<BaseType> {
  const folderDefinition = cabinetDefinition.definitions[
    folderName
  ] as FolderDefinition<BaseType>;
  const filepath = DocPath(
    cabinetDefinition.name,
    folderName,
    documentID
  );

  return {
    id: documentID,
    exists: ext.exists(filepath),
    makeCopy: (): BaseType | null => {
      if (!ext.exists(filepath))
        SHITBED('doc_doesnt_exist');

      return ext.readDocData(filepath);
    },
    update: (newData: BaseType): void => {
      if (!ext.exists(filepath))
        SHITBED('doc_doesnt_exist', {filepath: filepath});

      const validate = memoizedAjvCompile(
        folderDefinition.JTDSchema
      );
      if (!validate(newData)) SHITBED('invalid_doc_data', newData);

      ext.writeDocData<BaseType>(
        DocPath(
          cabinetDefinition.name,
          folderName,
          documentID
        ),
        newData
      );

      return;
    }
  };
}

function CreateFolderReference<BaseType>(
  cabinetDefinition: CabinetDefinition,
  folderName: string
): FolderReference<BaseType> {
  const folderDefinition = cabinetDefinition.definitions[
    folderName
  ] as FolderDefinition<BaseType>;

  return {
    name: folderName,
    JTDSchema: folderDefinition.JTDSchema,
    file: (
      newData: BaseType
    ): DocumentReference<BaseType> => {
  
      const validate = memoizedAjvCompile(
        folderDefinition.JTDSchema
      );

      // Validate data
      if (!validate(newData)) SHITBED('invalid_doc_data', validate.errors);

      const finalData = CheckPredicates<BaseType>(
        folderDefinition.predicates,
        newData
      );

      const reservedID = ValidID();

      ext.writeDocData<BaseType>(
        DocPath(
          cabinetDefinition.name,
          folderName,
          reservedID
        ),
        finalData
      );

      return CreateDocumentReference<BaseType>(
        cabinetDefinition,
        folderName,
        reservedID
      );
    },

    doc: (id: string): DocumentReference<BaseType> => {
      // huh, not much to this one
      return CreateDocumentReference<BaseType>(
        cabinetDefinition,
        folderName,
        id
      );
    }
  };
}

function CreateCabinetReference(
  cabinetDefinition: CabinetDefinition
): CabinetReference {
  const keys = Object.keys(cabinetDefinition.definitions);
  const [folderKeys, binderKeys] = folderAndBinderKeys(
    cabinetDefinition
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
        folderName
      );
    }
  };
}
/************************************************************/

const isBinder = (
  definition: FolderDefinition<any> | BinderDefinition
) =>
  (definition as FolderDefinition<any>).JTDSchema ===
  undefined;

// Sort folder and binder definition keys
// ~NOTE: kind of a stupid function
const folderAndBinderKeys = (
  cabinet: CabinetDefinition
): [string[], string[]] => {
  const keys = Object.keys(cabinet.definitions);
  const folderKeys = Array();
  const binderKeys = Array();
  keys.map((key: string) =>
    isBinder(cabinet.definitions[key])
      ? binderKeys.push(key)
      : folderKeys.push(key)
  );

  return [folderKeys, binderKeys];
};

/************************************************************/
function SHITBED(
  error_code: string,
  dump_data: any = {}
): void {
  throw Error(
    'BED = SHAT \n' +
    error_code +
    '\nDATA: ' +
    JSON.stringify(dump_data, undefined, 2)
  );
}

function DocPath(
  cabinetName: string,
  containerName: string,
  documentID: string
) {
  return `${CONFIG.relativeStoragePath}/${cabinetName}/${containerName}/${documentID}`;
}

function ValidID(): string {
  return Date.now().toString();
}

function CheckPredicates<T>(
  predicates:
    | (PredicateFunction<T> | PredicateObject<T>)[]
    | undefined,
  data: T
)  {
  if (typeof predicates === 'undefined') return data;

  let tempData = data;
  predicates.map(
    (
      P: PredicateFunction<T> | PredicateObject<T>,
      i: number
    ) => {
      if (typeof P === 'function') {
        if (!P(tempData))
          SHITBED('predicate_false', { predicate: P });
      } else {
        if (!P.function(tempData)) {
          tempData = P.hotfix(tempData);
          if (!P.function(tempData))
            SHITBED('predicate_false_after_hotfix', {
              predicate: P
            });
        }
      }
    }
  );

  return tempData;
}

/* Control */
export const FilingCabinets = {
  use: (
    cabinetDefinition: CabinetDefinition
  ): CabinetReference => {
    ext.buildCabinetTree(cabinetDefinition);

    return CreateCabinetReference(cabinetDefinition);
  }
};
