// Reference: W3Schools JSX guide — https://www.w3schools.com/react/react_jsx.asp
import { useEffect, useRef } from 'react';

function SearchBar(props) {
  const searchInput = useRef(null);
  useEffect(() => {
    searchInput.current.value = '';
  }, [props.listId]);

  function searchTask() {
    var input, filter, ul, li, i, txtValue;
    input = document.getElementById('myInput');
    filter = input.value.toUpperCase();
    ul = document.getElementById('myTasks');
    li = ul.getElementsByTagName('li');
    for (i = 0; i < li.length; i++) {
      txtValue = li[i].querySelector('.task-name').textContent;
      if (filter !== '' && txtValue.toUpperCase().startsWith(filter)) {
        li[i].style.display = '';
      } else {
        li[i].style.display = 'none';
      }
    }
  }
  return (
    <>
      <input
        ref={searchInput}
        type="text"
        id="myInput"
        onChange={searchTask}
        placeholder="Search for a task! ✎ ̼"
        title="Type in a task"
      ></input>
      <ul id="myTasks">
        {props.taskData.map((task) => (
          <li
            className="searched-tasks"
            style={{ display: 'none' }}
            key={task._id}
          >
            <div className="task-name">{task.name}</div>
            <div className="search-list-buttons">
              <button onClick={() => props.removeTask(task._id)}>Delete</button>
              <button onClick={() => props.archiveTask(task._id)}>
                Archive
              </button>{' '}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default SearchBar;
