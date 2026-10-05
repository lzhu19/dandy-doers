import { useState } from 'react';

function Form(props) {
  const [task, setTask] = useState({
    name: '',
  });

  function handleChange(event) {
    const { value } = event.target;
    setTask({ name: value });
  }

  function submitForm() {
    if (!task.name.trim()) return;

    props.handleSubmit(task);
    setTask({ name: '' });
  }

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="task-name">Task</label>
      <input
        type="text"
        id="task-name"
        name="name"
        value={task.name}
        onChange={handleChange}
      />
      <input type="button" value="Add" onClick={submitForm} />
    </form>
  );
}

export default Form;
