function DeleteList(props) {
  return (
    <details className="deleted-section">
      <summary>Deleted Tasks</summary>
      <ul>
        {props.deletedTasks.map((task) => (
          <li className="deleted-tasks" key={task._id}>
            <div>
              <div>{task.name}</div>
              <span className="task-list-label">
                {props.lists.find((list) => list._id === task.listId)?.name ??
                  'Unknown list'}
              </span>
            </div>
            <div className="delete-list-buttons">
              <button onClick={() => props.restoreDeletedTask(task._id)}>
                Restore
              </button>
              <button onClick={() => props.removeTask(task._id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default DeleteList;
