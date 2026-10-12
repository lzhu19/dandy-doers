// Reference: W3Schools JSX guide — https://www.w3schools.com/react/react_jsx.asp

function SearchBar(props) {
  function searchTask() {
    var input, filter, ul, li, a, i, txtValue;
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
          <li style={{ display: 'none' }} key={task._id}>
            {task.name}
          </li>
        ))}
      </ul>
    </>
  );
}

export default SearchBar;
