import { useState } from 'react';

function Form(props) {
  const [person, setPerson] = useState({
    // initial state
    name: '',
  });

  function handleChange(event) {
    const { task, value } = event.target;
    if (task) {
      setPerson({ name: person['task'] });
    } else {
      setPerson({ name: value });
    }
  }

  function submitForm() {
    props.handleSubmit(person);
    setPerson({ name: '' }); //, job: ''
  }

  return (
    <form>
      <label htmlFor="task">Task</label>
      <input
        type="text"
        task="task"
        _id="task"
        value={person.task}
        onChange={handleChange}
      />
      <input type="button" value="Add" onClick={submitForm} />
    </form>
  );
}

export default Form;
