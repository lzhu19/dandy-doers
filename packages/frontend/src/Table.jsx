function TableHeader() {
  return (
    <thead>
      <tr>
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
          <button onClick={() => props.removeTask(row._id)}>Delete</button>
        </td>
        <td>
          <button onClick={() => props.archiveTask(row._id)}>Archive</button>
        </td>
      </tr>
    );
  });
  return <tbody>{rows}</tbody>;
}

function Table(props) {
  return (
    <table>
      <TableHeader />
      <TableBody
        taskData={props.taskData}
        removeTask={props.removeTask}
        archiveTask={props.archiveTask}
        updateTask={props.updateTask}
        editingId={props.editingId}
        setEditingId={props.setEditingId}
      />
    </table>
  );
}

export default Table;
