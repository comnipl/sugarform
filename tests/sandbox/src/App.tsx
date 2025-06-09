import { useCallback } from 'react';
// Demo showing how validation errors appear in real usage
import './App.css';
import { useForm, TextInput, NumberInput, type Sugar } from '@sugarform/core';

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
      <hr />
      <BirthdayExample />
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

type Birthday = {
  year: number;
  month: number;
  day: number;
};

function BirthdayExample() {
  const birthdaySugar = useForm<Birthday>({
    template: { year: NaN, month: NaN, day: NaN },
  });

  const { fields } = birthdaySugar.useObject();

  const errors = birthdaySugar.useValidation<string>(
    useCallback((value, fail) => {
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
      <h2>Birthday</h2>
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
      <button
        type="button"
        onClick={async () => {
          const result = await birthdaySugar.get(true);
          console.log(result);
        }}
      >
        get birthday
      </button>
      {errors.map((e, i) => (
        <div key={i} className="error">
          {e}
        </div>
      ))}
    </div>
  );
}

export default App;
