'use strict';
/*

NOTES
~: afterthought
?: unsolved
!: critical

*/

let fs = require('fs');

import { GenericMutable } from './generics';
import Ajv, { JTDSchemaType, Schema, ValidateFunction } from 'ajv/dist/jtd';
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

type FilingCabinet = {
    write: (x: unknown) => boolean;
};
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
let folderBinderKeys = (cabinet: CabinetDefinition): 
    [string[], string[]] => {
    let keys = Object.keys(cabinet.definitions);
    let folderKeys = Array();
    let binderKeys = Array();
    keys.map((key: string) =>
        isBinder(cabinet.definitions[key]) ? 
            binderKeys.push(key) : 
            folderKeys.push(key)
    );
    return [folderKeys, binderKeys];
};

/************************************************************/

type CabinetRef = {
     
}

/* Control */
export let FilingCabinets = {
    use: (cabinet: CabinetDefinition): void => {
        let NEW: GenericMutable<STATE> = CURRENT;
        let keys = Object.keys(cabinet.definitions);
        let [folderKeys, binderKeys] = folderBinderKeys(cabinet);
    },
};