import { useEffect, useRef } from 'react';
import './App.css';
import { useForm, type Sugar } from '@sugarform/core';

function App() {
  const sugar = useForm<string>({
    template: 'Hello, Sugarform!',
  });

  useEffect(() => {
    setTimeout(() => {
      sugar.set('Hello, Sugarform!');
    }, 5000);
  }, [sugar]);

  return (
    <>
      <h1>Hello, Sugarform!</h1>
      <TextInput sugar={sugar} />
      <button type="button" onClick={async () => {
        const result = await sugar.get();
        alert(JSON.stringify( result ));
      }}
      >get</button>
    </>
  );
}

function TextInput({ sugar }: { sugar: Sugar<string> }) {

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      sugar.ready(
        () => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' })
          }
          return Promise.resolve({ result: 'success', value: ref.current.value })
        },
        (value) => {
          if (!ref.current) {
            return Promise.resolve({ result: 'unavailable' })
          }
          ref.current.value = value;
          return Promise.resolve({ result: 'success' })
        },
      );
    }
  }, []);

  return (
    <div>
      <input
        type="text"
        ref={ref}
      />
    </div>
  );
}

export default App;
