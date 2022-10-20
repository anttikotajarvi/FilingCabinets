"use strict";
let fs = require('fs');

let DEFAULTS = JSON.parse(
    fs.readFileSync('../defaults.json')
);
let getConfig = ():object => JSON.parse(
    fs.readFileSync(DEFAULTS.PROJECT_ROOT + "filcabsconfig.json")
);
let getCabinetDefinitionFiles = (lookIn: string[]):string[] => {
    let defs: string[] = [];
    lookIn.map(
        (definitionFolder: string, index:number) => {

            let files: string[] = 
                fs.readdirSync(definitionFolder)

            files.map(
                (file:string) => defs.push(file)
            );

        }
    );

    return defs;
}

type STATE = {
    readonly INITIALIZED:       boolean,        
    readonly CONFIG:            object,
    readonly DEFINITION_FILES:  string[],
    readonly DEFINITIONS:       object,
}
const INITIAL:STATE = {
    INITIALIZED:        false,
    CONFIG:             Object(),
    DEFINITION_FILES:   Array<string>(),    
    DEFINITIONS:        Object(),
}
type mutable<T> = {
    -readonly [P in keyof T]: T[any];
};


var CURRENT:STATE = INITIAL;

module.exports = {
    getState: ():STATE => { 
        return CURRENT;
    },

    initialize: (force:boolean = false):void => {

        // Reinitialize only if 'force' is true
        if(CURRENT.INITIALIZED && !force)  return;

        let NEW:mutable<STATE> = CURRENT;
    
        // Load config from file
        NEW.CONFIG = JSON.parse(
            fs.readFileSync(DEFAULTS.CONFIG_FILEPATH)
        );

        // Source all cabinet definition files
        let definition_files = getCabinetDefinitionFiles(
            NEW.CONFIG.cabinetDefinitionIncludes
        );
        NEW.DEFINITION_FILES = definition_files;

        // Source cabinet definitions into a single object
        NEW.DEFINITIONS = (():object => {
            var definitions = Object();
            definition_files.map((file:string) => {
                definitions = Object.assign(
                    definitions, 
                    JSON.parse(
                        fs.fileReadSync(file)
                    )
                );
            })
            return definitions;
        })();

        // Create storage folders accordingly
        


        // Successful initialization
        NEW.INITIALIZED = true;

        CURRENT = NEW;
    },

    getLoaded: ():string[] => Object.keys(CURRENT.DEFINITIONS)


}