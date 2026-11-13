import { useState } from 'react';
import TagPill from './TagPill';

function TaskDetails(props) {
  //start w/ clicked task's current vals
  const [name, setName] = useState(props.task.name);
  const [notes, setNotes] = useState(props.task.notes ?? '');
  const [tags, setTags] = useState(props.task.tags ?? []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');

  function handleSave() {
    if (!name.trim()) return;
    props.saveTaskDetails(props.task._id, { name, notes, tags });
  }

  //adds typed tag (if valid), then closes input
  function addTag() {
    const newTag = tagInput.trim().slice(0, 20);
    const isDuplicate = tags.some(
      (tag) => tag.toLowerCase() === newTag.toLowerCase()
    );
    if (newTag && !isDuplicate && tags.length < 5) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
    setIsAddingTag(false);
  }

  function handleTagKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      setIsAddingTag(false);
    }
  }

  function removeTag(tagToRemove) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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

          <span className="task-details-label">Tags</span>
          <div className="task-details-tags">
            {tags.map((tag, index) => (
              <TagPill
                key={tag}
                tag={tag}
                colorIndex={index}
                onRemove={() => removeTag(tag)}
              />
            ))}

            {isAddingTag ? (
              <input
                className="tag-input"
                type="text"
                aria-label="New tag"
                placeholder="Tag name"
                maxLength={20}
                autoFocus
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
              />
            ) : (
              tags.length < 5 && (
                <button
                  className="add-tag-button"
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                >
                  + Add tag
                </button>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default TaskDetails;
