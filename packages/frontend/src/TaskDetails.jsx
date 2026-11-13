import { useState, useEffect, useRef } from 'react';
import TagPill from './TagPill';
import DeadlineCountdown from './DeadlineCountdown';

function getLocalDateParts(date) {
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    hour: String(date.getHours()).padStart(2, '0'),
    minute: String(date.getMinutes()).padStart(2, '0'),
  };
}

function getNextMinuteParts() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 1, 0, 0);
  return getLocalDateParts(date);
}

function get12HourParts(hour) {
  const numericHour = Number(hour);
  return {
    hour: String(numericHour % 12 || 12).padStart(2, '0'),
    meridiem: numericHour < 12 ? 'AM' : 'PM',
  };
}

function to24Hour(hour, meridiem) {
  return String((Number(hour) % 12) + (meridiem === 'PM' ? 12 : 0)).padStart(
    2,
    '0'
  );
}

function TaskDetails(props) {
  const [name, setName] = useState(props.task.name);
  const [notes, setNotes] = useState(props.task.notes ?? '');
  const [tags, setTags] = useState(props.task.tags ?? []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const detailsDialogRef = useRef(null);

  useEffect(() => {
    const dialog = detailsDialogRef.current;
    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  const createdAt = props.task.createdAt
    ? new Date(props.task.createdAt)
    : null;

  const initialDeadline =
    props.task.deadline &&
    !Number.isNaN(new Date(props.task.deadline).getTime())
      ? getLocalDateParts(new Date(props.task.deadline))
      : getNextMinuteParts();

  const [hasDeadline, setHasDeadline] = useState(Boolean(props.task.deadline));
  const [deadlineDate, setDeadlineDate] = useState(initialDeadline.date);
  const [deadlineHour, setDeadlineHour] = useState(initialDeadline.hour);
  const [deadlineMinute, setDeadlineMinute] = useState(initialDeadline.minute);
  const [use24HourTime, setUse24HourTime] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayedTime = get12HourParts(deadlineHour);
  const displayedHour = use24HourTime ? deadlineHour : displayedTime.hour;
  const displayedMeridiem = displayedTime.meridiem;
  const nextMinute = getNextMinuteParts();
  const today = getLocalDateParts(new Date()).date;
  const isToday = deadlineDate === today;

  const selectedDeadline = deadlineDate
    ? new Date(`${deadlineDate}T${deadlineHour}:${deadlineMinute}:00`)
    : null;

  const deadlineIsInPast =
    !selectedDeadline ||
    Number.isNaN(selectedDeadline.getTime()) ||
    deadlineDate < today ||
    (isToday &&
      (deadlineHour < nextMinute.hour ||
        (deadlineHour === nextMinute.hour &&
          deadlineMinute < nextMinute.minute)));

  async function handleSave() {
    if (!name.trim()) return;

    if (
      hasDeadline &&
      (deadlineIsInPast ||
        !selectedDeadline ||
        selectedDeadline.getTime() <= Date.now())
    ) {
      setSaveError('Choose a valid future deadline.');
      return;
    }

    setSaveError('');
    setIsSaving(true);

    const updatedFields = { name, notes, tags };

    if (hasDeadline || props.task.deadline) {
      updatedFields.deadline = hasDeadline
        ? selectedDeadline.toISOString()
        : null;
    }

    try {
      await props.saveTaskDetails(props.task._id, updatedFields);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
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
    <dialog
      ref={detailsDialogRef}
      className="task-details-popup"
      aria-labelledby="task-details-title"
      onCancel={(event) => {
        event.preventDefault();
        detailsDialogRef.current.close();
        props.closeTaskDetails();
      }}
    >
      {/*
        task-details-header: whole top row of pop up
        task-details-heading: left side - title
        task-details-buttons: right side - cancel + save buttons
      */}
      <div className="task-details-header">
        <div className="task-details-heading">
          <h2 className="task-details-title" id="task-details-title">
            Task details
          </h2>
        </div>
        <div className="task-details-buttons">
          <button
            className="task-details-cancel"
            type="button"
            onClick={() => {
              detailsDialogRef.current.close();
              props.closeTaskDetails();
            }}
          >
            Cancel
          </button>
          <button
            className="add-task-button task-details-save"
            disabled={isSaving}
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

        {createdAt && !Number.isNaN(createdAt.getTime()) && (
          <time className="task-created-at" dateTime={createdAt.toISOString()}>
            Created at {createdAt.toLocaleString()}
          </time>
        )}

        <DeadlineCountdown
          deadline={props.task.deadline}
          className="task-created-at task-deadline-countdown task-deadline-countdown-popup"
          onExpire={() =>
            props.clearExpiredDeadline?.(props.task._id, props.task.deadline)
          }
        />

        <div className="task-deadline-toggle">
          <input
            id="task-deadline-enabled"
            type="checkbox"
            checked={hasDeadline}
            onChange={(event) => {
              setHasDeadline(event.target.checked);
              setSaveError('');
            }}
          />

          <label htmlFor="task-deadline-enabled">Set deadline?</label>
        </div>

        {hasDeadline && (
          <div className="task-deadline-fields">
            <label
              className="task-deadline-date-label"
              htmlFor="task-deadline-date"
            >
              Date Due
            </label>
            <label
              className="task-deadline-time-label"
              htmlFor="task-deadline-hour"
            >
              Time Due (XX:XX)
            </label>
            <input
              id="task-deadline-date"
              type="date"
              min={today}
              value={deadlineDate}
              onChange={(event) => {
                setDeadlineDate(event.target.value);
                if (
                  event.target.value === today &&
                  (deadlineHour < nextMinute.hour ||
                    (deadlineHour === nextMinute.hour &&
                      deadlineMinute < nextMinute.minute))
                ) {
                  setDeadlineHour(nextMinute.hour);
                  setDeadlineMinute(nextMinute.minute);
                }
                setSaveError('');
              }}
            />

            <div
              className={`task-deadline-time ${
                use24HourTime ? 'is-24-hour' : ''
              }`}
            >
              <select
                id="task-deadline-hour"
                aria-label="Deadline hour"
                value={displayedHour}
                onChange={(event) => {
                  setDeadlineHour(
                    use24HourTime
                      ? event.target.value
                      : to24Hour(event.target.value, displayedMeridiem)
                  );
                  setSaveError('');
                }}
              >
                {Array.from({ length: use24HourTime ? 24 : 12 }, (_, index) => {
                  const hour = use24HourTime
                    ? String(index).padStart(2, '0')
                    : String(index + 1).padStart(2, '0');

                  const hour24 = use24HourTime
                    ? hour
                    : to24Hour(hour, displayedMeridiem);

                  const isInPast =
                    isToday &&
                    (hour24 < nextMinute.hour ||
                      (hour24 === nextMinute.hour &&
                        deadlineMinute < nextMinute.minute));

                  return (
                    <option key={hour} value={hour} disabled={isInPast}>
                      {hour}
                    </option>
                  );
                })}
              </select>

              <span className="task-deadline-separator" aria-hidden="true">
                :
              </span>

              <select
                id="task-deadline-minute"
                aria-label="Deadline minute"
                value={deadlineMinute}
                onChange={(event) => {
                  setDeadlineMinute(event.target.value);
                  setSaveError('');
                }}
              >
                {Array.from({ length: 60 }, (_, minute) => {
                  const value = String(minute).padStart(2, '0');
                  const isInPast =
                    isToday &&
                    deadlineHour === nextMinute.hour &&
                    value < nextMinute.minute;

                  return (
                    <option key={value} value={value} disabled={isInPast}>
                      {value}
                    </option>
                  );
                })}
              </select>

              {!use24HourTime && (
                <select
                  aria-label="Deadline AM or PM"
                  value={displayedMeridiem}
                  onChange={(event) => {
                    setDeadlineHour(
                      to24Hour(displayedTime.hour, event.target.value)
                    );
                    setSaveError('');
                  }}
                >
                  {['AM', 'PM'].map((meridiem) => {
                    const hour24 = to24Hour(displayedTime.hour, meridiem);
                    const isInPast =
                      isToday &&
                      (hour24 < nextMinute.hour ||
                        (hour24 === nextMinute.hour &&
                          deadlineMinute < nextMinute.minute));

                    return (
                      <option
                        key={meridiem}
                        value={meridiem}
                        disabled={isInPast}
                      >
                        {meridiem}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="task-time-format-toggle">
              <input
                id="task-time-format"
                type="checkbox"
                checked={use24HourTime}
                onChange={(event) => setUse24HourTime(event.target.checked)}
              />
              <label htmlFor="task-time-format">24-hour time</label>
            </div>
          </div>
        )}

        {saveError && (
          <p className="task-details-error" role="alert">
            {saveError}
          </p>
        )}

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
    </dialog>
  );
}

export default TaskDetails;
