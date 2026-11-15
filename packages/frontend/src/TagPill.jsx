function TagPill(props) {
  return (
    <span className={`tag-pill tag-color-${props.colorIndex}`}>
      {props.tag}
      {props.onRemove && (
        <button
          className="tag-remove-button"
          type="button"
          aria-label={'Remove tag ${props.tag'}
          onClick={props.onRemove}
        >
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path
              d="M1 1L9 9M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

export default TagPill;
