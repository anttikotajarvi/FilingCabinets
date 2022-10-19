/*
Mutable structures
TAKE/RESERVE - takes doc for proprietary use, doubles as DELETE
RETURN - return to folder

READ - read document
DUMP - throw intermediate data to cache for preliminary schemaless storage
ARCHIVE - create a document, insert to folder
	VALIDATE
	FORMAT

Cabinet
	-> Folder
		-> File
	-> Binder 
		-> File

Cabinet
	- Folders and Binders defined
	- Static allocation
Folder
	- Defined schema
	- Dated, named datetime
		-> chronologically ordered
Binder
	- Schemaless
	- Named, named name_datetime
		-> alphabetically ordered


Schema Types
Schema definitions
	read function
	write function 
		- returns true or false
	 
	
		

*/


interface DocumentIdentifiers {
	time: number, // UNIX time 
	id: string    // hash?
}; 

let CreateLabel = (Parts: DocumentIdentifiers): string => {
	// Unix time first to sort docs chronologically
	return Parts.time + "_" + Parts.id;
};

interface FileSchema {
	read: Function;
	write: Function;
}
function CreateSchema(
	read: () => boolean,
	write: () => boolean
): FileSchema {
	return { 
		read: read,
		write: write
	}
}


//FilingCabinetCore.defineFolder<F>

