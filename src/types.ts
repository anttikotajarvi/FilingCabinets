let Ajv = require("ajv");
let ajv = new Ajv()
type FieldDefinition<T> = {
    default:    T,
    maxLength?: number,
    maxValue?:  number
}

type Schema = {
    fields: FieldDefinition<any>[]
}
type FolderDefinition = {
    name:   string,
    schema: Schema
}
type BinderDefinition = {
    name:   string,
}
type FilingCabinetDefinition = {
    name:       string,
    data:       FolderDefinition | BinderDefinition,
    copying?:   boolean,
    borrowing?: boolean
}

let MainCabinet: FilingCabinetDefinition = {
    name: "main",
    data: 12
}

class ValidFilename {
    
}