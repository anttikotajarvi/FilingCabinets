import { FilingCabinets, CabinetDefinition, FolderDefinition, BinderDefinition } from '../FilingCabinets';
import Ajv, { JTDDataType} from "ajv/dist/jtd"
import { UserPreferences } from 'typescript';

test('Use case', () => {
  type User = {
    name: string;
    age: number;
  };

  let main: CabinetDefinition = {
    name: 'main',
    definitions: {
      users: <FolderDefinition<User>>{
        name: 'ddd',
        JTDSchema: {
          properties: {
            name: { type: 'string' },
            age: { type: 'uint8' },
          },
        },
        predicates: [(x) => x.age > 12, (x) => x.name.includes(' ')],
      },
      bucket: <BinderDefinition>{
        predicates: [(x) => x.data.length < 1000],
      }
    }
  };
  // Load cabinet
  let mainCabinet:CabinetReference = FilingCabinets.use(main);

  // Specify folder (/binder)
  let users:FolderReference = mainCabinet.folder('users')

  // Derive type
  type userType = JTDDataType<typeof users.JTDSchema>

  // Create new 
  let newUser:userType = {
    name: "Antti",
    age: "21"
  }
  // File (*verb) document, returns ref
  // Document is lost if reference not captured
  let userRef:DocumentReference = users.file(newUser);
  console.log("User saved ", newUser, userRef);

  // Retrieve by id
  let retrievedUserRef:DocumentReference = users.doc(userRef.id);

  // Make copy of the doc ( get data )
  let retrievedUserData:userType = retrievedUser.makeCopy();
  expect(retrievedUserData.name).toBe("Antti");
  
  // Update data
  // ?NOTE: Semantic replacement needed for "update"
  retrievedUserData.name = "Aimo"
  retrievedUserRef.update(retrievedUserData)

  expect(retrievedUserRef.makeCopy().name).toBe("Aimo")


});
