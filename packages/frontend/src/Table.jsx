function TableHeader(props) {
  const selectAll = props.taskData.every((row) =>
    props.selectedTaskId.includes(row._id)
  );
  const selectedTask = props.selectedTaskId.length > 0;
  console.log('Lists received by Table:', props.lists);
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
              <button
                className="archive-icon-button"
                aria-label="Delete Task"
                onClick={() => {
                  props.selectedTaskId.forEach((id) => {
                    props.removeTask(id);
                  });
                }}
              >
                <DeleteIcon />
              </button>
              <button
                className="archive-icon-button"
                aria-label="Move Task To A Different List"
                onClick={() => {
                  props.setIsMoveTaskOpen(true);
                }}
              >
                <MoveListIcon />
              </button>
              {props.isMoveTaskOpen && (
                <div className="list-dialog-backdrop">
                  <section
                    className="list-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="move-task-title"
                  >
                    <h2 id="move-task-title">Choose a list to move a task to.</h2>

                    {props.lists
                      .filter((list) => list._id !== props.selectedListId)
                      .map((list) => (
                        <button
                          type="button"
                          key={list._id}
                          onClick={() => {
                            props.selectedTaskId.forEach((id) => {
                              props.moveTaskToList(id, list._id);
                            });

                            props.setIsMoveTaskOpen(false);
                          }}
                        >
                          {list.name}
                        </button>
                      ))}

                    <div className="list-dialog-actions">
                      <button
                        type="button"
                        onClick={() => props.setIsMoveTaskOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </section>
                </div>
              )}
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
        isMoveTaskOpen={props.isMoveTaskOpen}
        setIsMoveTaskOpen={props.setIsMoveTaskOpen}
        lists={props.lists}
        selectedListId={props.selectedListId}
        moveTaskToList={props.moveTaskToList}
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

function MoveListIcon() {
  return (
    <svg
      style={{ width: '29px', height: '29px', flexShrink: 0 }}
      viewBox="0 4.8 29 19.4"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="currentColor"
        strokeWidth="0.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.25 7.6H3.5A1 1 0 0 0 2.5 8.6v8.9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8.3" />
        <rect
          x="4.25"
          y="9.5"
          width="1.65"
          height="1.65"
          rx=".3"
          fill="currentColor"
        />
        <rect x="4.25" y="12.4" width="1.65" height="1.65" rx=".3" />
        <rect x="4.25" y="15.3" width="1.65" height="1.65" rx=".3" />
        <path d="M7.2 10.325h3.65M7.2 13.225h3.65M7.2 16.125h3.65" />

        <rect x="17.2" y="11.8" width="9.3" height="10.7" rx="1" />
        <rect x="18.9" y="13.6" width="1.55" height="1.55" rx=".3" />
        <rect x="18.9" y="16.4" width="1.55" height="1.55" rx=".3" />
        <rect x="18.9" y="19.2" width="1.55" height="1.55" rx=".3" />
        <path d="M21.8 14.375h3M21.8 17.175h3M21.8 19.975h3" />
      </g>
      <path
        d="M9.65 8.95C12.3 4.65 16.1 5.05 18.45 8.55l.65-.82a.35.35 0 0 1 .62.22v2.5a.35.35 0 0 1-.48.33l-2.43-.96a.35.35 0 0 1 .02-.66l.93-.3C15.2 5.8 12.65 6.5 10.7 8.72Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Table;
