function TaskDetails(props) {
  return (
    <div className="task-details-bg" onClick={props.closeTaskDetails}>
      <section
        className="task-details-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        onClick={(event) => event.stopPropagation()}
      ></section>
    </div>
  );
}

export default TaskDetails;
