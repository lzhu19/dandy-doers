import { useState } from 'react';

function Form(props) {
  const [person, setPerson] = useState({
    name: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setPerson({ [name]: value });
  }

  function submitForm() {
    if (!person.name.trim()) return;
    props.handleSubmit(person);
    setPerson({ name: '' });
  }

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="name">Task</label>
      <input
        type="text"
        id="name"
        name="name"
        value={person.name}
        onChange={handleChange}
      />
      <input type="button" value="Add" onClick={submitForm} />
    </form>
  );
}

export default Form;
