// Reference: W3Schools JSX guide — https://www.w3schools.com/react/react_jsx.asp

function SearchBar(props) {
  function searchTask() {
    var input, filter, ul, li, i, txtValue;
    input = document.getElementById('myInput');
    filter = input.value.toUpperCase();
    ul = document.getElementById('myTasks');
    li = ul.getElementsByTagName('li');
    for (i = 0; i < li.length; i++) {
      txtValue = li[i].textContent;
      if (txtValue.toUpperCase().indexOf(filter) > -1 && filter !== '') {
        li[i].style.display = '';
      } else {
        li[i].style.display = 'none';
      }
    }
  }
  return (
    <>
      <input
        type="text"
        id="myInput"
        onChange={searchTask}
        placeholder="Search for a task! ✎ ̼"
        title="Type in a name"
      ></input>
      <ul id="myTasks">
        {props.taskData.map((task) => (
          <li
            className="searched-tasks"
            style={{ display: 'none' }}
            key={task._id}
          >
            {task.name}
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
