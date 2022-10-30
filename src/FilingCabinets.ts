'use strict';
/*

NOTES
~: afterthought
?: unsolved
!: critical

*/

let fs = require('fs');

import { GenericMutable } from './generics';
import Ajv, { JTDDataType, JTDSchemaType, Schema, ValidateFunction } from 'ajv/dist/jtd';
let ajv = new Ajv();

/*  Types   */
export type BinderFile = {
  filename: string;
  data: string;
};
export type BinderDefinition = {
  predicates: ((x: BinderFile) => boolean)[];
};
export type FolderDefinition<X> = {
  JTDSchema: JTDSchemaType<X>;
  predicates?: ((x: X) => boolean)[];
};
export type CabinetDefinition = {
  readonly name: string;
  readonly definitions: {
    [key: string]: FolderDefinition<any> | BinderDefinition;
  };
};


type DocumentReference<BaseType> = {
  readonly id: string,
  readonly makeCopy: () => BaseType,
  readonly update: (newData: BaseType) => void
}

type FolderReference<BaseType> = {
  readonly name: string,
  readonly file: (docData: BaseType) => DocumentReference<BaseType>
}

type CabinetReference = {
  readonly name: string,
  readonly folder: (folderName: string) => FolderReference<any>,
}
/************************************************************/

/*  Module state    */
let DEFAULTS = JSON.parse(fs.readFileSync('../defaults.json'));

type STATE = {
  readonly INITIALIZED: boolean;
  readonly CONFIG: object;
  readonly CABINETS: {
    [key: string]: CabinetDefinition;
  };
};

let INITIAL: STATE;
{
  INITIAL = {
    INITIALIZED: false,
    CONFIG: Object(),
    CABINETS: Object(),
  };
}

var CURRENT: STATE = INITIAL;
/************************************************************/

/*  Local functions */
let getConfig = (): object => JSON.parse(fs.readFileSync(DEFAULTS.PROJECT_ROOT + 'filcabsconfig.json'));
let isBinder = (definition: FolderDefinition<any> | BinderDefinition) =>
  (<FolderDefinition<any>>definition).JTDSchema == undefined;

// Sort folder and binder definition keys
// ~NOTE: kind of a stupid function
let sortDefinitions = (cabinet: CabinetDefinition): { folderKeys: string[]; binderKeys: string[] } => {
  let keys = Object.keys(cabinet.definitions);
  let out = {
    folderKeys: Array(),
    binderKeys: Array(),
  };
  keys.map((key: string) => (isBinder(cabinet.definitions[key]) ? out.binderKeys.push(key) : out.folderKeys.push(key)));
  return out;
};

/************************************************************/




/* Control */
export let FilingCabinets = {
  use: (cabinetDefinition: CabinetDefinition): void => {
    let NEW: GenericMutable<STATE> = CURRENT;

    let keys = Object.keys(cabinetDefinition.definitions);

    let { folderKeys, binderKeys } = sortDefinitions(cabinetDefinition);
    let validate = Object();

    folderKeys.map((key:string) => {
      validate[key] = ajv.compile(
        (<FolderDefinition<any>>cabinetDefinition
          .definitions[key])
          .JTDSchema
      )
    })
    let Cabinet: CabinetReference = {
      name: cabinetDefinition.name,
      folder: (folderName: string) => {
      
        if(!folderKeys.includes(folderName))
          throw FCErrors.folder_not_found

        let FolderDefinition = <FolderDefinition<any>>cabinetDefinition.definitions[folderName];

        type BaseType = JTDDataType<typeof FolderDefinition.JTDSchema>
        
        return <FolderReference<any>>{
          name: folderName,
          file(docData: BaseType)
        }
      }
    }
  },
};

let FCErrors = {
  folder_not_found: Error('folder_not_found')
}