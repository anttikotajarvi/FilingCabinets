"use strict";
/*

NOTES
~: afterthought
?: unsolved
!: critical

*/


let fs = require('fs');

import { GenericMutable } from './generics';
import Ajv, {
    JTDSchemaType, 
    Schema, 
    ValidateFunction
} from "ajv/dist/jtd"
let ajv = new Ajv()

/*  Types   */
export type BinderFile = {
    filename:   string,
    data:       string
}
export type BinderDefinition = {
    predicates:    ((x: BinderFile) => boolean)[],
}
export type FolderDefinition<X> = {
    JTDSchema:      JTDSchemaType<X>,
    predicates?:    ((x: X) => boolean)[],
}
export type CabinetDefinition = {
    readonly name: string,
    readonly definitions: {
        [key:string]: FolderDefinition<any> | BinderDefinition
    }
}

type FilingCabinet = {
    write: (x: unknown) => boolean
}
/************************************************************/

/*  Module state    */ 
let DEFAULTS = JSON.parse(
    fs.readFileSync('../defaults.json')
);

type STATE = {
    readonly INITIALIZED:       boolean,        
    readonly CONFIG:            object,
    readonly CABINETS:          [key:string]: ,
    /*readonly CACHED?: {
        readonly COMPILED_CABINETS: null | {
            [cabinetKey:string]: {
                folders: {
                    [key:string]: {
                        validate: ValidateFunction,
                    }
                },
                binders: {}
            }
        }
    }*/

}

let INITIAL:STATE; 
{
    INITIAL = {
        INITIALIZED:        false,
        CONFIG:             Object(),
        CABINETS:           Object(),
    }
}

var CURRENT:STATE = INITIAL;
/************************************************************/

/*  Local functions */
let getConfig = ():object => JSON.parse(
    fs.readFileSync(DEFAULTS.PROJECT_ROOT + "filcabsconfig.json")
);
let isBinder = (definition: FolderDefinition<any> | BinderDefinition) =>
    (<FolderDefinition<any>>definition).JTDSchema == undefined



// Sort folder and binder definition keys
// ~NOTE: kind of a stupid function
let sortDefinitions = (cabinet: CabinetDefinition)
    :{folderKeys:string[], binderKeys:string[]} =>
    {
        let keys = Object.keys(cabinet.definitions);
        let out = {
            folderKeys: Array(),
            binderKeys: Array()
        }
        keys.map((key:string) => 
            isBinder(cabinet.definitions[key])  ?
                out.binderKeys.push(key)    :
                out.folderKeys.push(key)            
        );
        return out;
    }

/************************************************************/

/* Control */  
export let FilingCabinets = {

    use: (cabinet: CabinetDefinition):void => {
        let NEW:GenericMutable<STATE> = CURRENT;

        let keys = Object.keys(cabinet.definitions);

        let {folderKeys, binderKeys} = sortDefinitions(cabinet);

        // Compile JTD schemas for folder definitions
        // ?NOTE: Error handling, invalid schema -> just crash?
        let validate = Object();
        folderKeys.map((key:string) => 
            {
                NEW
                    .CACHED
                    .COMPILED_CABINETS[cabinet.name]
                    .folders[key] = {
                        validate: ajv.compile(
                            cabinet.definitions[key]
                        )
                    }
            }
        )



        

    },


    initialize: (force:boolean = false):void => {

        // Reinitialize only if 'force' is true
        if(CURRENT.INITIALIZED && !force)  return;

        let NEW:GenericMutable<STATE> = CURRENT;
    
        // Load config from file
        NEW.CONFIG = JSON.parse(
            fs.readFileSync(DEFAULTS.CONFIG_FILEPATH)
        );

        // Create storage folders accordingly
        


        // Successful initialization
        NEW.INITIALIZED = true;

        CURRENT = NEW;
    },

    // Helper functions
    getState: ():STATE => { 
        return CURRENT;
    },


}