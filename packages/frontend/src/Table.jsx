function TableHeader() {
  return (
    <thead>
      <tr>
        <th>Task</th>
        <th>Job</th>
        <th>ID</th>
      </tr>
    </thead>
  );
}

function TableBody(props) {
  const rows = props.taskData.map((row) => {
    return (
      <tr key={row._id}>
        <td>{row.name}</td>
        <td>{row.job}</td>
        <td>{row._id}</td>
        <td>
          <button onClick={() => props.removeTask(row._id)}>Delete</button>
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
      />
    </table>
  );
}

export default Table;
