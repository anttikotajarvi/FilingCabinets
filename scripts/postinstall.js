let fs = require('fs');
let path = require('path');

let OVERWRITE = false; // true to reinitialize files
let PROJECT_ROOT = path.normalize(__dirname+"/../../../");
let STORAGE_FOLDER_FILEPATH = PROJECT_ROOT + "FilingCabinets";
let CONFIG_FILEPATH = PROJECT_ROOT + "filcabsconfig.json";

/*          Create config file           */
let DEFAULT_CONFIG_TEMPLATE = `
{
    storageFolder: "${PROJECT_ROOT + ".FilingCabinets/"}",
    _comment: "Where the actual data will be stored",

    cabinetDefinitionIncludes: [
        "${PROJECT_ROOT + "FilingCabinets"}"
    ],
    _comment: "Where to look for cabinet definition .json files",

    travesingDefaultLimit:  1000,
    _comment: "Max. amount documents traverse() will go through by default",

    countingDefaultLimit:   20000,
    _comment: "Max. amount of documents count() will count by default"

    _comment: "v Sys. defaults v",
    projectRoot:        "${PROJECT_ROOT}",
    storageFolderPath:  "${STORAGE_FOLDER_FILEPATH}",
    configFilePath:     "${CONFIG_FILEPATH}"

}`;
let DEFAULT_CONFIG = JSON.parse(DEFAULT_CONFIG_TEMPLATE);
if(!fs.existsSync(CONFIG_FILEPATH) || OVERWRITE);
    fs.writeFileSync(
        PROJECT_ROOT + "filcabsconfig.json", 
        DEFAULT_CONFIG_TEMPLATE
    );

    

/*          Create storage folder          */
if(!fs.existsSync(STORAGE_FOLDER_FILEPATH))
    fs.mkdirSync(STORAGE_FOLDER_FILEPATH);






