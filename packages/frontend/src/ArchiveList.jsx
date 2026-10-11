function ArchiveList(props) {
  return (
    <details className="archived-section">
      <summary>Archived Tasks</summary>
      <ul>
        {props.archivedTasks.map((task) => (
          <li className="archived-tasks" key={task._id}>
            <div>
              <div>{task.name}</div>
              <span className="task-list-label">
                {props.lists.find((list) => list._id === task.listId)?.name ??
                  'Unknown list'}
              </span>
            </div>
            <div className="archive-list-buttons">
              <button onClick={() => props.restoreArchivedTask(task._id)}>
                Restore
              </button>
              <button onClick={() => props.deleteTask(task._id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default ArchiveList;
