import { useRef, useState } from 'react';
import DeadlineCountdown from './DeadlineCountdown';

function TableHeader(props) {
  const selectAll = props.taskData.every((row) =>
    props.selectedTaskId.includes(row._id)
  );
  return (
    <thead>
      <tr>
        <th className="task-checkbox-cell">
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
        </th>
        <th>Task</th>
        <th></th>
      </tr>
    </thead>
  );
}

function BulkActions(props) {
  //nothing selected, so nothing to show
  if (props.selectedTaskId.length === 0) {
    return null;
  }

  const otherLists = props.lists.filter(
    (list) => list._id !== props.selectedListId
  );

  return (
    <div className="bulk-select-actions">
      <span className="bulk-select-count">
        {props.selectedTaskId.length} selected
      </span>
      <button
        className="archive-icon-button"
        aria-label="Move Task To A Different List"
        onClick={() => {
          props.setIsMoveTaskOpen(true);
        }}
      >
        <MoveListIcon />
      </button>
      <button
        className="archive-icon-button"
        aria-label="Archive Selected Task"
        onClick={() => {
          props.selectedTaskId.forEach((id) => {
            props.archiveTask(id);
          });
          props.setSelectedTaskId([]);
        }}
      >
        <ArchiveIcon />
      </button>
      <button
        className="archive-icon-button"
        aria-label="Delete Selected Task"
        onClick={() => {
          props.selectedTaskId.forEach((id) => {
            props.removeTask(id);
          });
          props.setSelectedTaskId([]);
        }}
      >
        <DeleteIcon />
      </button>

      {props.isMoveTaskOpen && (
        <div
          className="task-details-bg"
          onClick={() => props.setIsMoveTaskOpen(false)}
        >
          <section
            className="move-task-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-task-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-details-header">
              <h2 className="task-details-title" id="move-task-title">
                Choose a list to move task(s) to
              </h2>
              <button
                className="task-details-cancel"
                type="button"
                onClick={() => props.setIsMoveTaskOpen(false)}
              >
                Cancel
              </button>
            </div>
            <hr className="task-details-divider" />

            <div className="move-task-body">
              {otherLists.length === 0 && (
                <p className="move-task-empty">No other lists available.</p>
              )}
              {otherLists.map((list) => (
                <button
                  className="user-list-select"
                  type="button"
                  key={list._id}
                  onClick={() => {
                    props.selectedTaskId.forEach((id) => {
                      props.moveTaskToList(id, list._id);
                    });
                    props.setSelectedTaskId([]);
                    props.setIsMoveTaskOpen(false);
                  }}
                >
                  {list.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

//////////////////////////
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
        <td className="task-checkbox-cell">
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
          <DeadlineCountdown
            deadline={row.deadline}
            className="task-deadline-countdown task-deadline-countdown-list"
            onExpire={() => props.clearExpiredDeadline?.(row._id, row.deadline)}
          />
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
      <td colSpan="3"></td>
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
    <>
      <BulkActions
        selectedTaskId={props.selectedTaskId}
        archiveTask={props.archiveTask}
        removeTask={props.removeTask}
        isMoveTaskOpen={props.isMoveTaskOpen}
        setIsMoveTaskOpen={props.setIsMoveTaskOpen}
        lists={props.lists}
        setSelectedTaskId={props.setSelectedTaskId}
        selectedListId={props.selectedListId}
        moveTaskToList={props.moveTaskToList}
      />
      <table>
        <TableHeader
          taskData={props.taskData}
          selectedTaskId={props.selectedTaskId}
          setSelectedTaskId={props.setSelectedTaskId}
        />
        <TableBody
          taskData={props.taskData}
          reorderTasks={props.reorderTasks}
          removeTask={props.removeTask}
          archiveTask={props.archiveTask}
          //deleteTask={props.deleteTask}
          updateTask={props.updateTask}
          clearExpiredDeadline={props.clearExpiredDeadline}
          selectedTaskId={props.selectedTaskId}
          setSelectedTaskId={props.setSelectedTaskId}
          editingId={props.editingId}
          setEditingId={props.setEditingId}
          setTaskDetailsId={props.setTaskDetailsId}
        />
      </table>
    </>
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

function MoveListIcon() {
  return (
    <svg
      className="move-list-icon"
      viewBox="0 0 12 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.085 1C2.18844 0.707422 2.38008 0.454129 2.63351 0.275028C2.88694 0.0959278 3.18967 -0.00016248 3.5 2.06237e-07H6.5C6.81033 -0.00016248 7.11306 0.0959278 7.36649 0.275028C7.61992 0.454129 7.81156 0.707422 7.915 1H8.5C8.89782 1 9.27936 1.15804 9.56066 1.43934C9.84196 1.72064 10 2.10218 10 2.5V4.6C9.68029 4.43668 9.34536 4.30505 9 4.207V2.5C9 2.36739 8.94732 2.24022 8.85355 2.14645C8.75979 2.05268 8.63261 2 8.5 2H7.915C7.81156 2.29258 7.61992 2.54587 7.36649 2.72497C7.11306 2.90407 6.81033 3.00016 6.5 3H3.5C3.18967 3.00016 2.88694 2.90407 2.63351 2.72497C2.38008 2.54587 2.18844 2.29258 2.085 2H1.5C1.36739 2 1.24021 2.05268 1.14645 2.14645C1.05268 2.24022 1 2.36739 1 2.5V12.5C1 12.6326 1.05268 12.7598 1.14645 12.8536C1.24021 12.9473 1.36739 13 1.5 13H3.257C3.571 13.38 3.934 13.716 4.337 14H1.5C1.10218 14 0.720644 13.842 0.43934 13.5607C0.158035 13.2794 0 12.8978 0 12.5V2.5C0 2.10218 0.158035 1.72064 0.43934 1.43934C0.720644 1.15804 1.10218 1 1.5 1H2.085ZM3.5 1C3.36739 1 3.24021 1.05268 3.14645 1.14645C3.05268 1.24022 3 1.36739 3 1.5C3 1.63261 3.05268 1.75979 3.14645 1.85355C3.24021 1.94732 3.36739 2 3.5 2H6.5C6.63261 2 6.75979 1.94732 6.85355 1.85355C6.94732 1.75979 7 1.63261 7 1.5C7 1.36739 6.94732 1.24022 6.85355 1.14645C6.75979 1.05268 6.63261 1 6.5 1H3.5ZM12 9.5C12 10.0909 11.8836 10.6761 11.6575 11.2221C11.4313 11.768 11.0998 12.2641 10.682 12.682C10.2641 13.0998 9.76804 13.4313 9.22208 13.6575C8.67611 13.8836 8.09095 14 7.5 14C6.90905 14 6.32389 13.8836 5.77792 13.6575C5.23196 13.4313 4.73588 13.0998 4.31802 12.682C3.90016 12.2641 3.56869 11.768 3.34254 11.2221C3.1164 10.6761 3 10.0909 3 9.5C3 8.30653 3.47411 7.16193 4.31802 6.31802C5.16193 5.47411 6.30653 5 7.5 5C8.69347 5 9.83807 5.47411 10.682 6.31802C11.5259 7.16193 12 8.30653 12 9.5ZM9.853 9.854L9.856 9.851C9.94752 9.7582 9.99919 9.63334 10 9.503V9.497C9.99918 9.36569 9.94674 9.23997 9.854 9.147L7.854 7.147C7.76025 7.05311 7.63304 7.00032 7.50035 7.00022C7.36767 7.00013 7.24039 7.05275 7.1465 7.1465C7.05261 7.24025 6.99982 7.36747 6.99972 7.50015C6.99963 7.63283 7.05225 7.76011 7.146 7.854L8.293 9H5.5C5.36739 9 5.24021 9.05268 5.14645 9.14645C5.05268 9.24021 5 9.36739 5 9.5C5 9.63261 5.05268 9.75979 5.14645 9.85355C5.24021 9.94732 5.36739 10 5.5 10H8.293L7.146 11.146C7.05211 11.2399 6.99937 11.3672 6.99937 11.5C6.99937 11.6328 7.05211 11.7601 7.146 11.854C7.23989 11.9479 7.36722 12.0006 7.5 12.0006C7.63278 12.0006 7.76011 11.9479 7.854 11.854L9.853 9.854Z"
        fill="currentColor"
      />
    </svg>
  );
}
export default Table;
