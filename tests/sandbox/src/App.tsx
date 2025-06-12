import { useCallback } from 'react';
// Demo showing how validation errors appear in real usage
import './App.css';
import { useForm, TextInput, NumberInput, type Sugar } from '@sugarform/core';

type Birthday = {
  year: number;
  month: number;
  day: number;
};

type Person = {
  firstName: string;
  lastName: string;
  birthday: Birthday;
};

type FormType = {
  person_a: Person;
  person_b: Person;
};

function App() {
  const { sugar, collect } = useForm<FormType>({
    template: {
      person_a: {
        firstName: 'Alice',
        lastName: 'Smith',
        birthday: { year: 2000, month: 1, day: 1 },
      },
      person_b: {
        firstName: 'Bob',
        lastName: 'Johnson',
        birthday: { year: 2000, month: 1, day: 1 },
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
          const result = await collect();
          console.log(result);
        }}
      >
        collect
      </button>
    </>
  );
}

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
      <BirthdayInput sugar={fields.birthday} />
    </div>
  );
}

function BirthdayInput({ sugar }: { sugar: Sugar<Birthday> }) {
  const { fields } = sugar.useObject();

  const errors = sugar.useValidation<string>(
    useCallback(async (value, fail) => {
      const complete =
        !Number.isNaN(value.year) &&
        !Number.isNaN(value.month) &&
        !Number.isNaN(value.day);
      if (!complete) {
        const missed: string[] = [];
        if (Number.isNaN(value.year)) missed.push('year');
        if (Number.isNaN(value.month)) missed.push('month');
        if (Number.isNaN(value.day)) missed.push('day');
        fail(`missing ${missed.join(', ')}`, 'submit');
        return;
      }

      const birthday = new Date(value.year, value.month - 1, value.day);
      const today = new Date();
      const age = today.getFullYear() - birthday.getFullYear();
      const passed =
        today.getMonth() > birthday.getMonth() ||
        (today.getMonth() === birthday.getMonth() &&
          today.getDate() >= birthday.getDate());
      if (age < 20 || (age === 20 && !passed)) {
        fail('must be at least 20 years old', 'blur');
      }
    }, [])
  );

  return (
    <div>
      <label>
        Year:
        <NumberInput sugar={fields.year} />
      </label>
      <label>
        Month:
        <NumberInput sugar={fields.month} />
      </label>
      <label>
        Day:
        <NumberInput sugar={fields.day} />
      </label>
      {errors.map((e, i) => (
        <div key={i} className="error">
          {e}
        </div>
      ))}
    </div>
  );
}

export default App;
