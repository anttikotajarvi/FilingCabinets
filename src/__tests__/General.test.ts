import {
  BinderDefinition,
  FolderDefinition,
  CabinetDefinition,
  DocumentReference,
  BinderReference,
  FolderReference,
  CabinetReference,
  FilingCabinets,
} from '../FilingCabinets';
import Ajv, { JTDDataType } from 'ajv/dist/jtd';

test('Folder test', () => {
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
        predicates: [
          (x) => x.age > 12,
          (x) => x.name.includes(' '),
        ],
      },
    },
  };
  // Load cabinet
  let mainCabinet: CabinetReference =
    FilingCabinets.use(main);

  // Specify folder (/binder)
  let users = mainCabinet.folder('users');

  // Derive type
  type userType = JTDDataType<typeof users.JTDSchema>;

  // Create new
  let newUser: userType = {
    name: 'Antti',
    age: '21',
  };
  // File (*verb) document, returns ref
  // Document is lost if reference not captured
  let userRef = users.file(newUser);
  console.log('User saved ', newUser, userRef);

  // Retrieve by id
  let retrievedUserRef = users.doc(userRef.id);

  // Make copy of the doc ( get data )
  let retrievedUserData = retrievedUserRef.makeCopy();
  expect(retrievedUserData.name).toBe('Antti');

  // Update data
  // ?NOTE: Semantic replacement needed for "update"
  retrievedUserData.name = 'Aimo';
  retrievedUserRef.update(retrievedUserData);

  expect(retrievedUserRef.makeCopy().name).toBe('Aimo');
});
