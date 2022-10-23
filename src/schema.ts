"use strict";

import Ajv, {JTDSchemaType, Schema} from "ajv/dist/jtd"
let ajv = new Ajv()



type FolderDefinition<StorageType> = {
    name: string,
    JTDSchema:     JTDSchemaType<StorageType>,
    predicates?:    ((x: StorageType) => boolean)[],
}

type BinderDefinition = {
    name:string,
    predicates:    ((x: any) => boolean)[],
}

type CabinetDefinition = {
    readonly name: string,
    readonly definitions: {
        [key:string]: FolderDefinition<any> | BinderDefinition
    }
}

type User = {
    name: string,
    age: number
}
let main:CabinetDefinition = {
    name: "main",
    definitions: {
        users: <any>{
            name:"ddd",
            JTDSchema: {
                properties: {
                    name: { type: "string" },
                    age:  { type: "uint8" }
                }
            },
            predicates: [
                (x) => x.age > 12,
                (x) => x.name.includes(" ")
            ]
        },
        user_login: {
            name: "gay",
            JTDSchema: <any>{
                properties: {
                    userID:     { type: "uint32" },
                    password:   { type: "string" }

                }
            }
        }
    }
}

main.definitions.users.name
function CreateCabinet(definition: CabinetDefinition)
{
    
}