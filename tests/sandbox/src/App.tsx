import { useEffect, useRef } from 'react';
import './App.css';
import { useForm, type Sugar } from '@sugarform/core';

type FormType = {
  person_a: Person;
  person_b: Person;
};

function App() {
  const sugar = useForm<FormType>({
    template: {
      person_a: {
        firstName: '',
        lastName: '',
      },
      person_b: {
        firstName: '',
        lastName: '',
      },
    },
  });

  const { fields } = sugar.useObject();

  return (
    <>
      <h1>Hello, Sugarform!</h1>
      <h2>Person A</h2>
      <PersonInput sugar={fields.person_a} />
      <h2>Person B</h2>
      <PersonInput sugar={fields.person_b} />
      <button
        type="button"
        onClick={async () => {
          const result = await sugar.get();
          console.log(result);
        }}
      >
        get
      </button>
    </>
  );
}

type Person = {
  firstName: string;
  lastName: string;
};

function PersonInput({ sugar }: { sugar: Sugar<Person> }) {
  const { fields } = sugar.useObject();

  return (
    <div>
      <label>
        First Name:
        <TextInput sugar={fields.firstName} />
      </label>
      <label>
        Last Name:
        <TextInput sugar={fields.lastName} />
      </label>
    </div>
  );
}

function TextInput({ sugar }: { sugar: Sugar<string> }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      sugar.ready(
        () => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' });
          }
          return Promise.resolve({
            result: 'success',
            value: ref.current.value,
          });
        },
        (value) => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' });
          }
          ref.current.value = value;
          return Promise.resolve({ result: 'success' });
        }
      );
    }
  }, [sugar]);

  return (
    <div>
      <input type="text" ref={ref} />
    </div>
  );
}

export default App;
