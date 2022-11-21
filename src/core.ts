'use strict';
import {
  CabinetDefinition,
  CabinetReference,
  FolderDefinition,
  FolderReference,
  DocumentReference,
  BinderDefinition,
  BinderReference,
  BinderFileReference,
  BinderFile,
  PredicateFunction,
  PredicateObject
} from './def';
import { memoize, anyToString } from './util';
import { SHITBED } from './err';
import Ajv, {
  JTDDataType,
  JTDSchemaType,
  Schema,
  ValidateFunction
} from 'ajv/dist/jtd';
import path = require('path');

const ajv = new Ajv();
const memoizedAjvCompile = memoize<ValidateFunction<any>>(
  (schema: JTDSchemaType<any>) => {
    return ajv.compile(schema);
  }
);

const CONFIG = require('rc')('filingcabinets', {
  suppressPredicateErrors: false,
  relativeStoragePath: '../.storage',

  port: 2468
});
// Needs to be declared and true for writing to .internal
const INTERNAL = true;

// Shorthand for path joining
const StoragePath = (...x: string[]) =>
  path.join(CONFIG.relativeStoragePath, ...x);

const ext = require('./ext');
/* Control */
export const FilingCabinets = {
  use: (
    cabinetDefinition: CabinetDefinition
  ): CabinetReference => {
    // Add .internal binder
    const _cabinetDefinition = cabinetDefinition;
    _cabinetDefinition.definitions['.internal'] = {
      predicates: [(x: BinderFile) => !!INTERNAL],
      read: (x: BinderFile) => x.buffer.toString(),
    } as BinderDefinition;

    const cabinetLock = anyToString(_cabinetDefinition);
    const cabinetReference = CreateCabinetReference(
      _cabinetDefinition 
    );
    const internalBinder =
      cabinetReference.binder('.internal');
    // Check if cabinet exists already
    if (ext.exists(StoragePath(cabinetDefinition.name))) {
      // Check if a cabinet is already defined under the same name
      const currentCabinetLock = internalBinder
        .doc('cabinet-lock')
        .makeCopy() 
      if (currentCabinetLock !== cabinetLock)
        SHITBED('conflicting_definition', {
          _cabinetDefinition,
          existingLock: currentCabinetLock,
          newLock: cabinetLock
        });
    } else {
      // Build Cabinet tree
      const storageF = CONFIG.relativeStoragePath;
      const cabinetF = path.join(
        storageF,
        _cabinetDefinition.name
      );
      ext.mkdir(storageF);
      ext.mkdir(cabinetF);
      Object.keys(_cabinetDefinition.definitions).map(
        (key: string) => {
          ext.mkdir(path.join(cabinetF, key));
        }
      );

      // Save internal file a doc to keep track of cabinets definition
      cabinetReference.binder('.internal').file({
        filename: 'cabinet-lock',
        buffer: Buffer.from(cabinetLock)
      });
    }

    return cabinetReference;
  }
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
  const filepath = StoragePath(
    cabinetDefinition.name,
    folderName,
    documentID
  );

  return {
    id: documentID,
    exists: ext.exists(filepath),
    makeCopy: (): BaseType => {
      if (!ext.exists(filepath))
        SHITBED('doc_doesnt_exist', { filepath });

      return ext.readDoc(filepath);
    },
    update: (newData: BaseType): void => {
      if (!ext.exists(filepath))
        SHITBED('doc_doesnt_exist', { filepath });

      const validate = memoizedAjvCompile(
        folderDefinition.JTDSchema
      );
      if (!validate(newData))
        SHITBED('invalid_doc_data', newData);

      ext.writeDoc(
        StoragePath(
          cabinetDefinition.name,
          folderName,
          documentID
        ),
        newData
      );

      return;
    },
    delete: () => ext.rm(filepath)
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
    cabinetName: cabinetDefinition.name,
    JTDSchema: folderDefinition.JTDSchema,
    file: (
      newData: BaseType
    ): DocumentReference<BaseType> => {
      const validate = memoizedAjvCompile(
        folderDefinition.JTDSchema
      );

      // Validate data
      if (!validate(newData))
        SHITBED('invalid_doc_data', validate.errors);

      const finalData = CheckPredicates<BaseType>(
        folderDefinition.predicates,
        newData
      );

      const reservedID = ValidID();

      ext.writeDoc(
        StoragePath(
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
    },

    traverse: (
      fn: (doc: DocumentReference<BaseType>) => boolean
    ) => {}
  };
}

function CreateBinderReference(
  cabinetDefinition: CabinetDefinition,
  binderName: string
): BinderReference {
  const binderDefinition = cabinetDefinition.definitions[
    binderName
  ] as BinderDefinition;

  return {
    name: binderName,
    file: (binderFile: BinderFile): BinderFileReference => {
      const filepath = StoragePath(
        cabinetDefinition.name,
        binderName,
        binderFile.filename
      );

      const _binderFile = CheckPredicates<BinderFile>(
        binderDefinition.predicates,
        binderFile
      );

      ext.writeFile(filepath, _binderFile.buffer);

      return CreateBinderFileReference(
        cabinetDefinition,
        binderName,
        _binderFile.filename
      );
    },

    doc: (filename: string) => {
      return CreateBinderFileReference(
        cabinetDefinition,
        binderName,
        filename
      );
    }
  };
}
function CreateBinderFileReference(
  cabinetDefinition: CabinetDefinition,
  binderName: string,
  filename: string
): BinderFileReference {
  const filepath = StoragePath(
    cabinetDefinition.name,
    binderName,
    filename
  );
  const definition = cabinetDefinition.definitions[binderName] as BinderDefinition;
  return {
    filename,
    exists: ext.exists(filepath),
    makeCopy: () => {
      return definition.read({
        filename,
        buffer: ext.readFile(filepath) as Buffer
      });
    },
    delete: () => ext.rm(filepath)
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
    },
    binder: (binderName: string): BinderReference => {
      if (!binderKeys.includes(binderName))
        folderKeys.includes(binderName)
          ? SHITBED('binder_addressed_as_folder', {
              binderName
            })
          : SHITBED('binder_not_found', { binderName });

      return CreateBinderReference(
        cabinetDefinition,
        binderName
      );
    },
    delete: () =>
      ext.rm(StoragePath(cabinetDefinition.name))
  };
}
// Utility
function buildCabinetTree(
  cabinetDefinition: CabinetDefinition
) {
  const storageF = CONFIG.relativeStoragePath;
  const cabinetF = path.join(
    storageF,
    cabinetDefinition.name
  );

  ext.mkdir(storageF);
  ext.mkdir(cabinetF);

  Object.keys(cabinetDefinition.definitions).map(
    (key: string) => {
      ext.mkdir(path.join(cabinetF, key));
    }
  );
}

const isBinder = (
  definition: FolderDefinition<any> | BinderDefinition
) =>
  (definition as FolderDefinition<any>).JTDSchema ===
  undefined;

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

function ValidID(): string {
  return Date.now().toString();
}

function CheckPredicates<T>(
  predicates:
    | (PredicateFunction<T> | PredicateObject<T>)[]
    | undefined,
  data: T
) {
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
