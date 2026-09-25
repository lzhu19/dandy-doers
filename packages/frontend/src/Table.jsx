import React from "react";

function TableHeader() {
  return (
    <thead>
      <tr>
        <th>Name</th>
        <th>Job</th>
        <th>ID</th>
      </tr>
    </thead>
  );
}

function TableBody(props) {
  const rows = props.characterData.map((row) => {
    return (
      <tr key={row._id}>
        <td>{row.name}</td>
        <td>{row.job}</td>
        <td>{row._id}</td>
        <td> 
          <button onClick = {() => props.removeCharacter(row._id)}>
            Delete
          </button>
        </td>
      </tr>
    );
  });
  return (
    <tbody>
      {rows}
    </tbody>
  );
}

function Table(props) {
    return (
       <table>
          <TableHeader />
          <TableBody 
            characterData={props.characterData} 
            removeCharacter={props.removeCharacter}
          />
      </table>
    );
}

export default Table;