function TableHeader(props) {
  const selectAll = props.taskData.every((row) =>
    props.selectedTaskId.includes(row._id)
  );
  const selectedTask = props.selectedTaskId.length > 0;
  return (
    <thead>
      <tr>
        <th>
          <label htmlFor="select-all">
            <input
              type="checkbox"
              id="select-all"
              checked={selectAll}
              onChange={(event) => {
                if (event.target.checked) {
                  props.setSelectedTaskId(props.taskData.map((row) => row._id));
                } else {
                  props.setSelectedTaskId([]);
                }
              }}
            ></input>
          </label>
          {selectedTask === true && (
            <div className="bulk-select-actions">
              <button
                className="archive-icon-button"
                aria-label="Archive Task"
                onClick={() => {
                  props.selectedTaskId.forEach((id) => {
                    props.archiveTask(id);
                  });
                }}
              >
                <ArchiveIcon />
              </button>
              {/* <button className="archive-icon-button" id="delete-button" aria-label="Delete task" onClick={() => props.removeTask(row._id)}><DeleteIcon/></button> */}
              {/* <button className="archive-icon-button" id="delete-button" aria-label="Move Task" onClick={() => props.removeTask(row._id)}>Move To New List</button> */}
            </div>
          )}
        </th>
        <th>Task</th>
        <th>ID</th>
      </tr>
    </thead>
  );
}

function TableBody(props) {
  const rows = props.taskData.map((row) => {
    const isEditing = props.editingId === row._id;
    return (
      <tr key={row._id}>
        <td>
          <label htmlFor={`checkbox-${row._id}`}>
            <input
              type="checkbox"
              id={`checkbox-${row._id}`}
              checked={props.selectedTaskId.includes(row._id)}
              onChange={(event) => {
                if (event.target.checked) {
                  props.setSelectedTaskId((previous) => [...previous, row._id]);
                } else {
                  props.setSelectedTaskId((previous) =>
                    previous.filter((id) => id !== row._id)
                  );
                }
              }}
            ></input>
          </label>
        </td>
        <td onClick={() => props.setEditingId(row._id)}>
          {(() => {
            if (isEditing) {
              return (
                <input
                  type="text"
                  defaultValue={row.name}
                  autoFocus
                  onBlur={(event) =>
                    props.updateTask(row._id, event.target.value)
                  }
                />
              );
            } else {
              return row.name;
            }
          })()}
        </td>
        <td>{row._id}</td>
        <td>
          <div className="task-actions">
            <button
              className="archive-icon-button"
              aria-label="Archive task"
              onClick={() => props.archiveTask(row._id)}
            >
              <ArchiveIcon />
            </button>
            <button
              className="delete-icon-button"
              aria-label="Delete task"
              onClick={() => props.removeTask(row._id)}
            >
              <DeleteIcon />
            </button>
          </div>
        </td>
      </tr>
    );
  });
  return <tbody>{rows}</tbody>;
}

function Table(props) {
  return (
    <table>
      <TableHeader
        taskData={props.taskData}
        selectedTaskId={props.selectedTaskId}
        setSelectedTaskId={props.setSelectedTaskId}
        removeTask={props.removeTask}
        archiveTask={props.archiveTask}
      />
      <TableBody
        taskData={props.taskData}
        removeTask={props.removeTask}
        archiveTask={props.archiveTask}
        //deleteTask={props.deleteTask}
        updateTask={props.updateTask}
        selectedTaskId={props.selectedTaskId}
        setSelectedTaskId={props.setSelectedTaskId}
        editingId={props.editingId}
        setEditingId={props.setEditingId}
      />
    </table>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.75 24.5C1.75 25.468 2.53203 26.25 3.5 26.25H24.5C25.468 26.25 26.25 25.468 26.25 24.5V8.75H1.75V24.5ZM10.5 12.9062C10.5 12.5453 10.7953 12.25 11.1562 12.25H16.8438C17.2047 12.25 17.5 12.5453 17.5 12.9062V13.3438C17.5 13.7047 17.2047 14 16.8438 14H11.1562C10.7953 14 10.5 13.7047 10.5 13.3438V12.9062ZM26.25 1.75H1.75C0.782031 1.75 0 2.53203 0 3.5V6.125C0 6.60625 0.39375 7 0.875 7H27.125C27.6063 7 28 6.60625 28 6.125V3.5C28 2.53203 27.218 1.75 26.25 1.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.0832 17.9172L14.5015 14.5001M14.5015 14.5001L17.9187 11.0829M14.5015 14.5001L11.0832 11.0829M14.5015 14.5001L17.9187 17.9172M14.5003 26.5834C21.1739 26.5834 26.5837 21.1737 26.5837 14.5001C26.5837 7.82646 21.1739 2.41675 14.5003 2.41675C7.8267 2.41675 2.41699 7.82646 2.41699 14.5001C2.41699 21.1737 7.8267 26.5834 14.5003 26.5834Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Table;
