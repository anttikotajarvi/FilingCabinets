import {
  BinderDefinition,
  FolderDefinition,
  CabinetDefinition,
  DocumentReference,
  BinderReference,
  FolderReference,
  CabinetReference,
  FilingCabinets
} from '../FilingCabinets';
import Ajv, {
  JTDDataType,
  JTDSchemaType,
  ValidateFunction
} from 'ajv/dist/jtd';
import { memoize } from '../generics';
import { fstat, mkdirSync } from 'fs';

type User = {
  name: string;
  age: number;
};
const TestUser = {
  name: 'Test',
  age: 18
};

test('Memoize ajv test', () => {
  const ajv = new Ajv();

  const memoizedAjvCompile = memoize<ValidateFunction<any>>(
    (schema: JTDSchemaType<any>) => {
      return ajv.compile(schema);
    }
  );
  const JTDSchema = {
    properties: {
      name: { type: 'string' },
      age: { type: 'uint8' }
    }
  };

  const validate = memoizedAjvCompile(
    JTDSchema as JTDSchemaType<User>
  );

  expect(validate(TestUser)).toBe(true);
});
let main: CabinetDefinition;
let mainCabinet: CabinetReference;
test('Define cabinet', () => {
  // Define cabinet
  main = {
    name: 'main',
    definitions: {
      users: <FolderDefinition<User>>{
        JTDSchema: {
          properties: {
            name: { type: 'string' },
            age: { type: 'uint8' }
          }
        },
        predicates: [(x) => x.age > 12]
      },
      bucket: <BinderDefinition>{}
    }
  };

  // Load cabinet
  mainCabinet = FilingCabinets.use(main);
});

test('Folder test', () => {
  // Specify folder (/binder)
  let users = mainCabinet.folder('users');

  // Derive type
  type userType = JTDDataType<typeof users.JTDSchema>;

  // Create new
  let newUser: userType = {
    name: 'Antti',
    age: 21
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

test('Binder test', () => {
  let b = new Blob(['hw'], { type: 'text/plain' });
});
