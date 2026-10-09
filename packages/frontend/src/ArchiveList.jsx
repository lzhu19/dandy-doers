function ArchiveList(props) {
  return (
    <details className="archived-section">
      <summary>Archived Tasks</summary>
      <ul>
        {props.archivedTasks.map((task) => (
          <li className="archived-tasks" key={task._id}>
            {task.name}
            <div className="archive-list-buttons">
              <button onClick={() => props.restoreArchivedTask(task._id)}>
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

export default ArchiveList;
