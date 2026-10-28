import { useRef, useState } from 'react';

function TableHeader() {
  return (
    <thead>
      <th>Task</th>
      <th></th>
    </thead>
  );
}

function TableBody(props) {
  const draggedTaskId = useRef(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const rows = props.taskData.map((row) => {
    const isEditing = props.editingId === row._id;

    return (
      <tr
        key={row._id}
        className={dropTargetId === row._id ? 'drop-target' : ''}
        draggable={true}
        onDragStart={(event) => {
          draggedTaskId.current = row._id;
          event.dataTransfer.effectAllowed = 'move';

          // Use only the task row as the drag preview
          event.dataTransfer.setDragImage(
            event.currentTarget,
            event.nativeEvent.offsetX,
            event.nativeEvent.offsetY
          );

          event.currentTarget.classList.add('dragging');
        }}
        onDragEnd={(event) => {
          event.currentTarget.classList.remove('dragging');
          draggedTaskId.current = null;
          setDropTargetId(null);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';

          if (draggedTaskId.current !== row._id) {
            setDropTargetId(row._id);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();

          const draggedId = draggedTaskId.current;
          const targetTaskId = row._id;

          if (draggedId && draggedId !== targetTaskId) {
            props.reorderTasks(draggedId, targetTaskId);
          }

          draggedTaskId.current = null;
          setDropTargetId(null);
        }}
      >
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

        <td className="task-actions-cell">
          <div className="task-actions">
            <button
              className="edit-icon-button"
              aria-label="Open task details"
              onClick={() => props.setTaskDetailsId(row._id)}
            >
              <EditIcon />
            </button>

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

  const bottomDropZone = (
    <tr
      className={`bottom-drop-zone ${
        dropTargetId === 'bottom' ? 'drop-target' : ''
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTargetId('bottom');
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const draggedId = draggedTaskId.current;

        if (draggedId) {
          props.reorderTasks(
            draggedId,
            props.taskData[props.taskData.length - 1]?._id
          );
        }

        draggedTaskId.current = null;
        setDropTargetId(null);
      }}
    >
      <td colSpan="2"></td>
    </tr>
  );

  return (
    <tbody>
      {rows}
      {bottomDropZone}
    </tbody>
  );
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
        reorderTasks={props.reorderTasks}
        removeTask={props.removeTask}
        archiveTask={props.archiveTask}
        //deleteTask={props.deleteTask}
        updateTask={props.updateTask}
        selectedTaskId={props.selectedTaskId}
        setSelectedTaskId={props.setSelectedTaskId}
        editingId={props.editingId}
        setEditingId={props.setEditingId}
        setTaskDetailsId={props.setTaskDetailsId}
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

function EditIcon() {
  return (
    <svg viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.3358 5.34938C23.119 5.13285 22.8252 5.01123 22.5188 5.01123C22.2124 5.01123 21.9185 5.13285 21.7017 5.34938L7.52913 19.5204C7.38423 19.6654 7.28048 19.8463 7.22851 20.0445L5.68684 25.9491C5.63595 26.1443 5.63697 26.3493 5.68982 26.5439C5.74266 26.7385 5.84548 26.9159 5.98807 27.0585C6.13066 27.2011 6.30807 27.3039 6.50268 27.3568C6.69729 27.4096 6.90234 27.4106 7.09747 27.3598L12.999 25.8181C13.198 25.7659 13.3794 25.6616 13.5247 25.5159L27.6957 11.3449C27.9122 11.1281 28.0338 10.8342 28.0338 10.5278C28.0338 10.2214 27.9122 9.92755 27.6957 9.71075L23.3358 5.34938ZM9.3853 20.9341L22.5188 7.80217L25.2429 10.5263L12.111 23.6598L8.42176 24.6233L9.3853 20.9341Z"
        fill="currentColor"
      />
      <path
        d="M6.16699 29.2947C5.86034 29.2947 5.56624 29.4165 5.3494 29.6333C5.13256 29.8502 5.01074 30.1443 5.01074 30.4509C5.01074 30.7576 5.13256 31.0517 5.3494 31.2685C5.56624 31.4854 5.86034 31.6072 6.16699 31.6072H29.292C29.5986 31.6072 29.8927 31.4854 30.1096 31.2685C30.3264 31.0517 30.4482 30.7576 30.4482 30.4509C30.4482 30.1443 30.3264 29.8502 30.1096 29.6333C29.8927 29.4165 29.5986 29.2947 29.292 29.2947H6.16699Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Table;
