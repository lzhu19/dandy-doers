import { useState } from 'react';

function TaskDetails(props) {
  //start w/ clicked task's current vals
  const [name, setName] = useState(props.task.name);
  const [notes, setNotes] = useState(props.task.notes ?? '');

  function handleSave() {
    if (!name.trim()) return;
    props.saveTaskDetails(props.task._id, { name, notes });
  }

  return (
    <div className="task-details-bg" onClick={props.closeTaskDetails}>
      <section
        className="task-details-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        onClick={(event) => event.stopPropagation()}
      >
        {/* 
        task-details-header: whole top row of pop up
        task-details-heading: left side - title
        task-details-buttons: right side - cancel + save buttons
        */}
        <div className="task-details-header">
          <div className="task-details-heading">
            <h2 className="task-details-title">Task details</h2>
          </div>
          <div className="task-details-buttons">
            <button
              className="task-details-cancel"
              type="button"
              onClick={props.closeTaskDetails}
            >
              Cancel
            </button>
            <button
              className="add-task-button task-details-save"
              type="button"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
        <hr className="task-details-divider" />

        <div className="task-details-body">
          <label className="task-details-label" htmlFor="task-details-name">
            Task
          </label>
          <input
            className="task-details-input"
            type="text"
            id="task-details-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label className="task-details-label" htmlFor="task-details-notes">
            Notes
          </label>
          <textarea
            className="task-details-textarea"
            id="task-details-notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </section>
    </div>
  );
}

export default TaskDetails;
