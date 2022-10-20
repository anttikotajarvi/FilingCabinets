"use strict";
let fs = require('fs');

let getConfig = (
        path:string = __dirname + "/../../../filcabsconfig.json"
    ):object => {
    let config:object;

    try{
        config = JSON.parse(
            fs.readFileSync(path)
        );
    } catch(e) {
        throw "Error loading the filcabconfig.json file, check postinstall.js and FilingCabinets.ts"
    }

    return config;
}
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
    getState: ():STATE => { return CURRENT },
    initialize: (force:boolean = false):void => {

        if(CURRENT.INITIALIZED && !force)  return;

        let NEW:mutable<STATE> = CURRENT;
        
        NEW.CONFIG = getConfig();
        NEW.DEFINITION_FILES =
            getCabinetDefinitionFiles(
                NEW.CONFIG.cabinetDefinitionIncludes
            );


        CURRENT = NEW;
    }


}