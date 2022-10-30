import { FilingCabinets, CabinetDefinition, FolderDefinition, BinderDefinition } from '../FilingCabinets';


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

  let mainCabinet = FilingCabinets.use(main);
  type userType = mainCabinet.folder('users').type
  let newUser:userType = {
    name: "Antti",
    age: "21"
  }
});
