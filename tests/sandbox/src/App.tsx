import { useCallback, useState } from 'react';
// Demo showing how validation errors appear in real usage
import './App.css';
import {
  useForm,
  TextInput,
  NumberInput,
  type Sugar,
  type SugarTemplateState,
} from '@sugarform/core';

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
  const [isLoading, setIsLoading] = useState(true);

  const initialTemplate: SugarTemplateState<FormType> = isLoading
    ? { status: 'pending' }
    : {
        status: 'resolved',
        value: {
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
      };

  const { sugar, collect } = useForm<FormType>({
    template: initialTemplate,
  });

  const { fields } = sugar.useObject();
  const isPending = sugar.useIsPending();

  return (
    <>
      <h1>Hello, Sugarform!</h1>
      {isPending ? (
        <div>Loading template...</div>
      ) : (
        <>
          <h2>Person A</h2>
          <PersonInput sugar={fields.person_a} />
          <h2>Person B</h2>
          <PersonInput sugar={fields.person_b} />
        </>
      )}
      <button
        type="button"
        onClick={() => {
          setIsLoading(false);
          sugar.setTemplate({
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
          });
        }}
        disabled={!isPending}
      >
        Load Data
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await collect();
          console.log(result);
        }}
        disabled={isPending}
      >
        collect
      </button>
    </>
  );
}

function PersonInput({ sugar }: { sugar: Sugar<Person> }) {
  const { fields } = sugar.useObject();
  const isPending = sugar.useIsPending();

  if (isPending) {
    return <div>Loading person data...</div>;
  }

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
  const isPending = sugar.useIsPending();

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

  if (isPending) {
    return <div>Loading birthday data...</div>;
  }

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
