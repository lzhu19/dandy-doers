function TaskDetails(props) {
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
            <button className="add-task-button task-details-save" type="button">
              Save
            </button>
          </div>
        </div>
        <hr className="task-details-divider" />
      </section>
    </div>
  );
}

export default TaskDetails;
