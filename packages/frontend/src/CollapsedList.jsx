function CollapsedList(props){
    return (
        <details className="archived-section">
            <summary>Archived Tasks</summary>
            <ul>
                {props.archivedTasks.map((task) =>  (
                    <li className="archived-task" key={task._id}>
                        {task.name}
                        <button className="restore-button"onClick={() => props.restoreArchivedTask(task._id)}>Restore</button>
                    </li>
                ))}
            </ul>
        </details>
    )
}

export default CollapsedList;