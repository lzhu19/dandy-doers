import { useState } from 'react';

function Login(props) {
  const [creds, setCreds] = useState({ username: '', pwd: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    setCreds({ ...creds, [name]: value });
  }

  function submit(handler) {
    handler(creds);
    setCreds({ username: '', pwd: '' });
  }

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="username">Username</label>
      <input
        type="text"
        id="username"
        name="username"
        value={creds.username}
        onChange={handleChange}
      />
      <label htmlFor="pwd">Password</label>
      <input
        type="password"
        id="pwd"
        name="pwd"
        value={creds.pwd}
        onChange={handleChange}
      />
      <input
        type="button"
        value="Log In"
        className="add-task-button"
        onClick={() => submit(props.handleLogin)}
      />
      <input
        type="button"
        value="Sign Up"
        className="add-task-button"
        onClick={() => submit(props.handleSignup)}
      />
      {props.message && <p role="alert">{props.message}</p>}
    </form>
  );
}

export default Login;
